// ============================================================
// WEBSOCKET GATEWAY
// Real-time communication hub for messages, presence, voice
// ============================================================

import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { verifyToken } from '@/shared/utils/crypto';
import { prisma } from '@/config/database';
import {
  redis,
  registerWebSocket,
  unregisterWebSocket,
  getUserSockets,
  publishEvent,
  CHANNELS,
  subscribeToChannel,
  updatePresence,
} from '@/config/redis';
import { snowflake } from '@/shared/utils/snowflake';
import { GatewayOpcodes, GatewayCloseCodes } from '@/shared/types';

// Socket.io instance
let io: any;

// Connected clients map
const connectedClients = new Map<string, Socket>();

// User socket mapping
const userSockets = new Map<string, Set<string>>();

// Heartbeat configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

/**
 * Setup WebSocket gateway
 */
export function setupWebSocketGateway(app: FastifyInstance): void {
  // Register WebSocket route
  app.get('/gateway', { websocket: true }, (socket: Socket, req: any) => {
    handleConnection(socket);
  });

  // Setup Socket.IO with Redis adapter for horizontal scaling
  io = require('socket.io')(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: HEARTBEAT_TIMEOUT,
    pingInterval: HEARTBEAT_INTERVAL,
  });

  // Use Redis adapter for multi-server scaling
  const { createAdapter } = require('@socket.io/redis-adapter');
  io.adapter(createAdapter(redis, redis.duplicate()));

  // Handle connections
  io.on('connection', handleSocketIOConnection);

  // Subscribe to cross-server events
  subscribeToChannel(CHANNELS.GATEWAY_EVENTS, handleCrossServerEvent);

  console.log('📡 WebSocket gateway initialized');
}

/**
 * Handle raw WebSocket connection
 */
function handleConnection(socket: Socket): void {
  console.log('Raw WebSocket connected');

  socket.on('message', (data: string) => {
    try {
      const message = JSON.parse(data);
      handleWebSocketMessage(socket, message);
    } catch (error) {
      socket.send(JSON.stringify({
        op: GatewayOpcodes.DISPATCH,
        t: 'ERROR',
        d: { message: 'Invalid message format' },
      }));
    }
  });

  socket.on('close', () => {
    console.log('Raw WebSocket disconnected');
  });
}

/**
 * Handle Socket.IO connection
 */
async function handleSocketIOConnection(socket: Socket): Promise<void> {
  console.log(`Socket connected: ${socket.id}`);

  // Store client
  connectedClients.set(socket.id, socket);

  // Send HELLO
  socket.emit('message', {
    op: GatewayOpcodes.HELLO,
    d: {
      heartbeatInterval: HEARTBEAT_INTERVAL,
      sessionId: socket.id,
    },
  });

  // Setup heartbeat
  let heartbeatTimeout: NodeJS.Timeout;

  const resetHeartbeat = () => {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(() => {
      console.log(`Heartbeat timeout for socket ${socket.id}`);
      socket.disconnect(true);
    }, HEARTBEAT_TIMEOUT);
  };

  resetHeartbeat();

  // Handle identify (authentication)
  socket.on('IDENTIFY', async (data: any) => {
    try {
      const { token, intents, properties } = data;

      // Verify token
      const payload = verifyToken(token);

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await prisma.users.findUnique({
        where: { id: BigInt(payload.userId) },
        select: {
          id: true,
          snowflakeId: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          subscriptionTier: true,
        },
      });

      if (!user || user.status === 'deleted') {
        throw new Error('User not found');
      }

      // Check session
      const session = await prisma.userSessions.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.revokedAt || new Date() > session.expiresAt) {
        throw new Error('Session expired');
      }

      // Attach user data to socket
      socket.data.user = user;
      socket.data.sessionId = payload.sessionId;
      socket.data.authenticated = true;

      // Register in Redis
      await registerWebSocket(payload.sessionId, user.id, socket.id);

      // Add to user sockets
      const userIdStr = user.id.toString();
      if (!userSockets.has(userIdStr)) {
        userSockets.set(userIdStr, new Set());
      }
      userSockets.get(userIdStr)!.add(socket.id);

      // Update presence
      await updatePresence(user.id, 'online');
      await prisma.users.update({
        where: { id: user.id },
        data: { status: 'online', lastSeenAt: new Date() },
      });

      // Broadcast presence to friends and server members
      broadcastPresence(user.id, 'online');

      // Send READY event
      socket.emit('message', {
        op: GatewayOpcodes.DISPATCH,
        t: 'READY',
        d: {
          user: {
            id: user.id.toString(),
            snowflakeId: user.snowflakeId.toString(),
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            status: user.status,
          },
          sessionId: socket.id,
        },
      });

      // Join user's servers
      const servers = await prisma.serverMembers.findMany({
        where: { userId: user.id },
        select: { serverId: true },
      });

      for (const server of servers) {
        socket.join(`server:${server.serverId}`);
      }

      // Join DM channels
      const dmChannels = await prisma.channelRecipients.findMany({
        where: { userId: user.id },
        select: { channelId: true },
      });

      for (const channel of dmChannels) {
        socket.join(`channel:${channel.channelId}`);
      }

      console.log(`User ${user.username} authenticated on socket ${socket.id}`);

    } catch (error) {
      console.error('Authentication failed:', error);
      socket.emit('message', {
        op: GatewayOpcodes.INVALID_SESSION,
        d: { message: 'Authentication failed' },
      });
      socket.disconnect(true);
    }
  });

  // Handle heartbeat
  socket.on('HEARTBEAT', () => {
    resetHeartbeat();
    socket.emit('message', {
      op: GatewayOpcodes.HEARTBEAT_ACK,
    });
  });

  // Handle presence update
  socket.on('PRESENCE_UPDATE', async (data: any) => {
    if (!socket.data.authenticated) return;

    const { status, customStatus } = data;
    const userId = socket.data.user.id;

    await updatePresence(userId, status, customStatus);
    await prisma.users.update({
      where: { id: userId },
      data: { status, customStatus },
    });

    broadcastPresence(userId, status, customStatus);
  });

  // Handle message create
  socket.on('MESSAGE_CREATE', async (data: any) => {
    if (!socket.data.authenticated) return;

    try {
      const message = await handleMessageCreate(socket, data);
      socket.emit('message', {
        op: GatewayOpcodes.DISPATCH,
        t: 'MESSAGE_ACK',
        d: { nonce: data.nonce, messageId: message.id.toString() },
      });
    } catch (error) {
      socket.emit('message', {
        op: GatewayOpcodes.DISPATCH,
        t: 'MESSAGE_ERROR',
        d: { nonce: data.nonce, error: (error as Error).message },
      });
    }
  });

  // Handle typing start
  socket.on('TYPING_START', async (data: any) => {
    if (!socket.data.authenticated) return;

    const { channelId } = data;
    const userId = socket.data.user.id;

    // Set typing in Redis
    await redis.hset(`typing:${channelId}`, userId.toString(), Date.now());
    await redis.expire(`typing:${channelId}`, 10);

    // Broadcast to channel
    io.to(`channel:${channelId}`).emit('message', {
      op: GatewayOpcodes.DISPATCH,
      t: 'TYPING_START',
      d: {
        channelId: channelId.toString(),
        userId: userId.toString(),
        timestamp: Date.now(),
      },
    });
  });

  // Handle voice state update
  socket.on('VOICE_STATE_UPDATE', async (data: any) => {
    if (!socket.data.authenticated) return;

    await handleVoiceStateUpdate(socket, data);
  });

  // Handle reaction add
  socket.on('REACTION_ADD', async (data: any) => {
    if (!socket.data.authenticated) return;

    await handleReactionAdd(socket, data);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    clearTimeout(heartbeatTimeout);
    connectedClients.delete(socket.id);

    if (socket.data.authenticated && socket.data.user) {
      const userId = socket.data.user.id;

      // Unregister from Redis
      await unregisterWebSocket(userId, socket.id);

      // Remove from user sockets
      const userIdStr = userId.toString();
      const sockets = userSockets.get(userIdStr);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userIdStr);
          // User went offline
          await updatePresence(userId, 'offline');
          await prisma.users.update({
            where: { id: userId },
            data: { status: 'offline', lastSeenAt: new Date() },
          });
          broadcastPresence(userId, 'offline');
        }
      }
    }

    console.log(`Socket disconnected: ${socket.id}`);
  });
}

/**
 * Handle WebSocket message
 */
function handleWebSocketMessage(socket: Socket, message: any): void {
  const { op, d } = message;

  switch (op) {
    case GatewayOpcodes.HEARTBEAT:
      socket.send(JSON.stringify({ op: GatewayOpcodes.HEARTBEAT_ACK }));
      break;

    case GatewayOpcodes.IDENTIFY:
      // Handle authentication
      break;

    default:
      socket.send(JSON.stringify({
        op: GatewayOpcodes.DISPATCH,
        t: 'ERROR',
        d: { message: 'Unknown opcode' },
      }));
  }
}

/**
 * Handle message creation
 */
async function handleMessageCreate(socket: Socket, data: any): Promise<any> {
  const { channelId, content, nonce, replyTo, attachments, mentions } = data;
  const userId = socket.data.user.id;

  // Validate channel access
  const channel = await prisma.channels.findUnique({
    where: { id: BigInt(channelId) },
  });

  if (!channel) {
    throw new Error('Channel not found');
  }

  // Check permissions
  if (channel.serverId) {
    const member = await prisma.serverMembers.findFirst({
      where: {
        serverId: channel.serverId,
        userId,
      },
    });

    if (!member) {
      throw new Error('Not a member of this server');
    }
  } else {
    // DM channel
    const recipient = await prisma.channelRecipients.findFirst({
      where: {
        channelId: BigInt(channelId),
        userId,
      },
    });

    if (!recipient) {
      throw new Error('Not a recipient of this DM');
    }
  }

  // Generate snowflake ID
  const snowflakeId = snowflake.generate();

  // Create message
  const message = await prisma.messages.create({
    data: {
      snowflakeId,
      channelId: BigInt(channelId),
      authorId: userId,
      content,
      nonce,
      referencedMessageId: replyTo ? BigInt(replyTo) : undefined,
      mentions: mentions || [],
      attachments: attachments || [],
    },
    include: {
      author: {
        select: {
          id: true,
          snowflakeId: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Update channel's last message
  await prisma.channels.update({
    where: { id: BigInt(channelId) },
    data: { lastMessageId: message.id },
  });

  // Broadcast to channel
  const messageData = {
    op: GatewayOpcodes.DISPATCH,
    t: 'MESSAGE_CREATE',
    d: {
      id: message.id.toString(),
      snowflakeId: message.snowflakeId.toString(),
      channelId: channelId.toString(),
      author: message.author,
      content: message.content,
      timestamp: message.timestamp,
      nonce: message.nonce,
      referencedMessageId: message.referencedMessageId?.toString(),
      mentions: message.mentions,
      attachments: message.attachments,
    },
  };

  io.to(`channel:${channelId}`).emit('message', messageData);

  // Publish for cross-server broadcast
  await publishEvent(CHANNELS.MESSAGE_BROADCAST, {
    channelId: channelId.toString(),
    message: messageData,
  });

  // Handle mentions and notifications
  await handleMentions(message, mentions);

  return message;
}

/**
 * Handle voice state update
 */
async function handleVoiceStateUpdate(socket: Socket, data: any): Promise<void> {
  const { guildId, channelId, selfMute, selfDeaf, selfVideo } = data;
  const userId = socket.data.user.id;

  if (channelId) {
    // Joining or updating voice channel
    const voiceState = {
      userId: userId.toString(),
      guildId: guildId?.toString(),
      channelId: channelId.toString(),
      sessionId: socket.id,
      isSelfMuted: selfMute || false,
      isSelfDeafened: selfDeaf || false,
      isVideoEnabled: selfVideo || false,
    };

    // Store in Redis
    await redis.hset(`voice:${channelId}`, userId.toString(), JSON.stringify(voiceState));
    await redis.set(`voice_user:${userId}`, channelId.toString());

    // Join voice channel room
    socket.join(`voice:${channelId}`);

    // Broadcast to channel
    io.to(`voice:${channelId}`).emit('message', {
      op: GatewayOpcodes.DISPATCH,
      t: 'VOICE_STATE_UPDATE',
      d: voiceState,
    });

    // If joining, send voice server update
    if (config.voice.enabled) {
      socket.emit('message', {
        op: GatewayOpcodes.DISPATCH,
        t: 'VOICE_SERVER_UPDATE',
        d: {
          token: generateVoiceToken(userId, channelId),
          guildId: guildId?.toString(),
          endpoint: config.voice.livekit.wsUrl,
        },
      });
    }
  } else {
    // Leaving voice channel
    const currentChannel = await redis.get(`voice_user:${userId}`);
    if (currentChannel) {
      await redis.hdel(`voice:${currentChannel}`, userId.toString());
      await redis.del(`voice_user:${userId}`);

      socket.leave(`voice:${currentChannel}`);

      io.to(`voice:${currentChannel}`).emit('message', {
        op: GatewayOpcodes.DISPATCH,
        t: 'VOICE_STATE_UPDATE',
        d: {
          userId: userId.toString(),
          guildId: guildId?.toString(),
          channelId: null,
        },
      });
    }
  }
}

/**
 * Handle reaction add
 */
async function handleReactionAdd(socket: Socket, data: any): Promise<void> {
  const { channelId, messageId, emoji } = data;
  const userId = socket.data.user.id;

  // Create or update reaction
  const reaction = await prisma.reactions.upsert({
    where: {
      messageId_userId_emojiId_emojiName: {
        messageId: BigInt(messageId),
        userId,
        emojiId: emoji.id ? BigInt(emoji.id) : null,
        emojiName: emoji.name,
      },
    },
    update: {},
    create: {
      messageId: BigInt(messageId),
      channelId: BigInt(channelId),
      userId,
      emojiId: emoji.id ? BigInt(emoji.id) : null,
      emojiName: emoji.name,
      emojiAnimated: emoji.animated || false,
    },
  });

  // Get reaction count
  const count = await prisma.reactions.count({
    where: {
      messageId: BigInt(messageId),
      emojiId: emoji.id ? BigInt(emoji.id) : null,
      emojiName: emoji.name,
    },
  });

  // Broadcast to channel
  io.to(`channel:${channelId}`).emit('message', {
    op: GatewayOpcodes.DISPATCH,
    t: 'MESSAGE_REACTION_ADD',
    d: {
      messageId: messageId.toString(),
      channelId: channelId.toString(),
      userId: userId.toString(),
      emoji,
      count,
    },
  });
}

/**
 * Handle mentions and create notifications
 */
async function handleMentions(message: any, mentions: any[]): Promise<void> {
  if (!mentions || mentions.length === 0) return;

  for (const mention of mentions) {
    const mentionedUserId = BigInt(mention.id);

    // Don't notify self
    if (mentionedUserId === message.authorId) continue;

    // Create notification
    await prisma.notifications.create({
      data: {
        userId: mentionedUserId,
        type: 'mention',
        title: 'New Mention',
        body: `${message.author.username} mentioned you`,
        data: {
          messageId: message.id.toString(),
          channelId: message.channelId.toString(),
        },
        sourceUserId: message.authorId,
        sourceChannelId: message.channelId,
      },
    });

    // Send real-time notification if online
    const sockets = userSockets.get(mentionedUserId.toString());
    if (sockets && sockets.size > 0) {
      for (const socketId of sockets) {
        const client = connectedClients.get(socketId);
        if (client) {
          client.emit('message', {
            op: GatewayOpcodes.DISPATCH,
            t: 'NOTIFICATION_CREATE',
            d: {
              type: 'mention',
              message: `${message.author.username} mentioned you`,
              channelId: message.channelId.toString(),
              messageId: message.id.toString(),
            },
          });
        }
      }
    }
  }
}

/**
 * Broadcast presence update
 */
function broadcastPresence(
  userId: bigint,
  status: string,
  customStatus?: string
): void {
  const presenceData = {
    op: GatewayOpcodes.DISPATCH,
    t: 'PRESENCE_UPDATE',
    d: {
      userId: userId.toString(),
      status,
      customStatus,
      lastSeenAt: new Date().toISOString(),
    },
  };

  // Broadcast to all servers the user is in
  io.emit('message', presenceData);
}

/**
 * Handle cross-server events
 */
function handleCrossServerEvent(data: any): void {
  // Handle events from other servers
  if (data.channelId) {
    io.to(`channel:${data.channelId}`).emit('message', data.message);
  }
}

/**
 * Generate voice token (for LiveKit/Mediasoup)
 */
function generateVoiceToken(userId: bigint, channelId: bigint): string {
  // Simple token generation - replace with actual LiveKit token generation
  return `voice_${userId}_${channelId}_${Date.now()}`;
}

/**
 * Broadcast event to specific user
 */
export async function broadcastToUser(userId: bigint, event: any): Promise<void> {
  const sockets = await getUserSockets(userId);
  for (const socketId of sockets) {
    const client = connectedClients.get(socketId);
    if (client) {
      client.emit('message', event);
    }
  }
}

/**
 * Broadcast event to server
 */
export function broadcastToServer(serverId: bigint, event: any): void {
  io.to(`server:${serverId}`).emit('message', event);
}

/**
 * Broadcast event to channel
 */
export function broadcastToChannel(channelId: bigint, event: any): void {
  io.to(`channel:${channelId}`).emit('message', event);
}

/**
 * Get connected user count
 */
export function getConnectedUsersCount(): number {
  return connectedClients.size;
}

// Export io for use in other modules
export { io };
