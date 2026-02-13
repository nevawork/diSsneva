// ============================================================
// MESSAGE SERVICE
// Handles message CRUD, search, and threading
// ============================================================

import { prisma } from '@/config/database';
import { redis, cacheMessage, getCachedMessages, invalidateMessageCache } from '@/config/redis';
import { snowflake } from '@/shared/utils/snowflake';
import { Permissions, PermissionUtils } from '@/shared/constants/permissions';

// Types
export interface CreateMessageData {
  channelId: bigint;
  authorId: bigint;
  content?: string;
  attachments?: any[];
  replyTo?: bigint;
  mentions?: any[];
  nonce?: string;
}

export interface UpdateMessageData {
  content: string;
}

export interface MessageQuery {
  channelId: bigint;
  before?: bigint;
  after?: bigint;
  around?: bigint;
  limit?: number;
}

export interface SearchQuery {
  query: string;
  channelId?: bigint;
  serverId?: bigint;
  authorId?: bigint;
  mentions?: bigint;
  has?: ('link' | 'embed' | 'file' | 'video' | 'image' | 'sound')[];
  before?: Date;
  after?: Date;
  limit?: number;
}

const MAX_MESSAGES_LIMIT = 100;
const DEFAULT_MESSAGES_LIMIT = 50;

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageData): Promise<any> {
  // Validate content or attachments
  if (!data.content && (!data.attachments || data.attachments.length === 0)) {
    throw new Error('Message must have content or attachments');
  }

  // Check channel access
  const channel = await prisma.channels.findUnique({
    where: { id: data.channelId },
  });

  if (!channel || channel.isDeleted) {
    throw new Error('Channel not found');
  }

  // Check permissions for server channels
  if (channel.serverId) {
    const canSend = await checkChannelPermission(
      data.authorId,
      channel.serverId,
      data.channelId,
      Permissions.SEND_MESSAGES
    );

    if (!canSend) {
      throw new Error('You do not have permission to send messages in this channel');
    }
  } else {
    // DM channel - check if recipient
    const recipient = await prisma.channelRecipients.findFirst({
      where: {
        channelId: data.channelId,
        userId: data.authorId,
      },
    });

    if (!recipient) {
      throw new Error('You are not a recipient of this DM');
    }
  }

  // Check rate limit
  const rateKey = `message:rate:${data.authorId}:${data.channelId}`;
  const currentCount = await redis.incr(rateKey);
  if (currentCount === 1) {
    await redis.expire(rateKey, 60); // 1 minute window
  }

  if (currentCount > 30) {
    throw new Error('Rate limit exceeded. Please slow down.');
  }

  // Generate snowflake ID
  const snowflakeId = snowflake.generate();

  // Process mentions
  const processedContent = data.content || '';
  const extractedMentions = extractMentions(processedContent);

  // Create message
  const message = await prisma.messages.create({
    data: {
      snowflakeId,
      channelId: data.channelId,
      authorId: data.authorId,
      content: processedContent,
      nonce: data.nonce,
      referencedMessageId: data.replyTo,
      mentions: extractedMentions.users,
      mentionRoles: extractedMentions.roles,
      mentionChannels: extractedMentions.channels,
      attachments: data.attachments || [],
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
      referencedMessage: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  // Update channel's last message
  await prisma.channels.update({
    where: { id: data.channelId },
    data: { lastMessageId: message.id },
  });

  // Cache message
  await cacheMessage(data.channelId, message);

  // Create notifications for mentions
  await createMentionNotifications(message, extractedMentions);

  return message;
}

/**
 * Get messages from a channel
 */
export async function getMessages(query: MessageQuery): Promise<any[]> {
  const limit = Math.min(query.limit || DEFAULT_MESSAGES_LIMIT, MAX_MESSAGES_LIMIT);

  // Try cache for recent messages
  if (!query.before && !query.after && !query.around) {
    const cached = await getCachedMessages(query.channelId, limit);
    if (cached.length >= limit) {
      return cached;
    }
  }

  // Build where clause
  const where: any = {
    channelId: query.channelId,
    isDeleted: false,
  };

  if (query.before) {
    where.id = { lt: query.before };
  } else if (query.after) {
    where.id = { gt: query.after };
  } else if (query.around) {
    where.id = {
      gte: query.around - BigInt(Math.floor(limit / 2)),
      lte: query.around + BigInt(Math.floor(limit / 2)),
    };
  }

  const messages = await prisma.messages.findMany({
    where,
    take: limit,
    orderBy: { id: 'desc' },
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
      referencedMessage: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  // Cache recent messages
  if (!query.before && !query.after) {
    for (const message of messages) {
      await cacheMessage(query.channelId, message);
    }
  }

  return messages.reverse();
}

/**
 * Get a single message
 */
export async function getMessage(messageId: bigint): Promise<any> {
  const message = await prisma.messages.findUnique({
    where: { id: messageId },
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
      referencedMessage: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!message || message.isDeleted) {
    throw new Error('Message not found');
  }

  return message;
}

/**
 * Update a message
 */
export async function updateMessage(
  messageId: bigint,
  userId: bigint,
  data: UpdateMessageData
): Promise<any> {
  const message = await prisma.messages.findUnique({
    where: { id: messageId },
    include: {
      channel: true,
    },
  });

  if (!message || message.isDeleted) {
    throw new Error('Message not found');
  }

  // Check permissions
  const isAuthor = message.authorId === userId;
  let canEdit = isAuthor;

  if (!isAuthor && message.channel.serverId) {
    canEdit = await checkChannelPermission(
      userId,
      message.channel.serverId,
      message.channelId,
      Permissions.MANAGE_MESSAGES
    );
  }

  if (!canEdit) {
    throw new Error('You do not have permission to edit this message');
  }

  // Store edit history
  const editHistory = message.editHistory || [];
  editHistory.push({
    content: message.content,
    editedAt: new Date(),
  });

  // Update message
  const updated = await prisma.messages.update({
    where: { id: messageId },
    data: {
      content: data.content,
      editedTimestamp: new Date(),
      editCount: { increment: 1 },
      editHistory: editHistory.slice(-10), // Keep last 10 edits
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

  // Invalidate cache
  await invalidateMessageCache(message.channelId);

  return updated;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  messageId: bigint,
  userId: bigint
): Promise<void> {
  const message = await prisma.messages.findUnique({
    where: { id: messageId },
    include: {
      channel: true,
    },
  });

  if (!message || message.isDeleted) {
    throw new Error('Message not found');
  }

  // Check permissions
  const isAuthor = message.authorId === userId;
  let canDelete = isAuthor;

  if (!isAuthor && message.channel.serverId) {
    canDelete = await checkChannelPermission(
      userId,
      message.channel.serverId,
      message.channelId,
      Permissions.MANAGE_MESSAGES
    );
  }

  if (!canDelete) {
    throw new Error('You do not have permission to delete this message');
  }

  // Soft delete
  await prisma.messages.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      content: '[deleted]',
      attachments: [],
      embeds: [],
    },
  });

  // Invalidate cache
  await invalidateMessageCache(message.channelId);
}

/**
 * Bulk delete messages
 */
export async function bulkDeleteMessages(
  channelId: bigint,
  messageIds: bigint[],
  userId: bigint
): Promise<void> {
  if (messageIds.length > 100) {
    throw new Error('Cannot delete more than 100 messages at once');
  }

  const channel = await prisma.channels.findUnique({
    where: { id: channelId },
  });

  if (!channel || !channel.serverId) {
    throw new Error('Invalid channel');
  }

  const canDelete = await checkChannelPermission(
    userId,
    channel.serverId,
    channelId,
    Permissions.MANAGE_MESSAGES
  );

  if (!canDelete) {
    throw new Error('You do not have permission to delete messages');
  }

  // Soft delete all messages
  await prisma.messages.updateMany({
    where: {
      id: { in: messageIds },
      channelId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      content: '[deleted]',
      attachments: [],
      embeds: [],
    },
  });

  // Invalidate cache
  await invalidateMessageCache(channelId);

  // Create audit log entry
  await prisma.auditLogs.create({
    data: {
      serverId: channel.serverId,
      actionType: 73, // MESSAGE_BULK_DELETE
      userId,
      options: {
        count: messageIds.length,
        channelId: channelId.toString(),
      },
    },
  });
}

/**
 * Pin a message
 */
export async function pinMessage(
  messageId: bigint,
  userId: bigint
): Promise<void> {
  const message = await prisma.messages.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });

  if (!message || message.isDeleted) {
    throw new Error('Message not found');
  }

  if (!message.channel.serverId) {
    throw new Error('Cannot pin messages in DMs');
  }

  const canPin = await checkChannelPermission(
    userId,
    message.channel.serverId,
    message.channelId,
    Permissions.MANAGE_MESSAGES
  );

  if (!canPin) {
    throw new Error('You do not have permission to pin messages');
  }

  await prisma.messages.update({
    where: { id: messageId },
    data: { isPinned: true },
  });

  // Create audit log
  await prisma.auditLogs.create({
    data: {
      serverId: message.channel.serverId,
      actionType: 74, // MESSAGE_PIN
      userId,
      targetId: messageId,
    },
  });
}

/**
 * Unpin a message
 */
export async function unpinMessage(
  messageId: bigint,
  userId: bigint
): Promise<void> {
  const message = await prisma.messages.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });

  if (!message || message.isDeleted) {
    throw new Error('Message not found');
  }

  if (!message.channel.serverId) {
    throw new Error('Cannot unpin messages in DMs');
  }

  const canUnpin = await checkChannelPermission(
    userId,
    message.channel.serverId,
    message.channelId,
    Permissions.MANAGE_MESSAGES
  );

  if (!canUnpin) {
    throw new Error('You do not have permission to unpin messages');
  }

  await prisma.messages.update({
    where: { id: messageId },
    data: { isPinned: false },
  });

  // Create audit log
  await prisma.auditLogs.create({
    data: {
      serverId: message.channel.serverId,
      actionType: 75, // MESSAGE_UNPIN
      userId,
      targetId: messageId,
    },
  });
}

/**
 * Search messages
 */
export async function searchMessages(query: SearchQuery): Promise<any> {
  const limit = Math.min(query.limit || 25, 100);

  const where: any = {
    isDeleted: false,
  };

  if (query.channelId) {
    where.channelId = query.channelId;
  }

  if (query.authorId) {
    where.authorId = query.authorId;
  }

  if (query.before) {
    where.timestamp = { lt: query.before };
  }

  if (query.after) {
    where.timestamp = { gt: query.after };
  }

  // Full-text search on content
  if (query.query) {
    where.content = {
      contains: query.query,
      mode: 'insensitive',
    };
  }

  // Filter by attachments
  if (query.has?.includes('file')) {
    where.attachments = { not: '[]' };
  }

  if (query.has?.includes('embed')) {
    where.embeds = { not: '[]' };
  }

  const messages = await prisma.messages.findMany({
    where,
    take: limit,
    orderBy: { timestamp: 'desc' },
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
      channel: {
        select: {
          id: true,
          name: true,
          serverId: true,
        },
      },
    },
  });

  return messages;
}

/**
 * Get pinned messages
 */
export async function getPinnedMessages(channelId: bigint): Promise<any[]> {
  const messages = await prisma.messages.findMany({
    where: {
      channelId,
      isPinned: true,
      isDeleted: false,
    },
    orderBy: { timestamp: 'desc' },
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

  return messages;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function checkChannelPermission(
  userId: bigint,
  serverId: bigint,
  channelId: bigint,
  permission: bigint
): Promise<boolean> {
  // Check if user is server owner
  const server = await prisma.servers.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (server?.ownerId === userId) {
    return true;
  }

  // Get member with roles
  const member = await prisma.serverMembers.findFirst({
    where: {
      serverId,
      userId,
    },
    include: {
      roleMembers: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!member) {
    return false;
  }

  // Calculate permissions
  const permissions = member.roleMembers.reduce((acc, rm) => {
    return acc | BigInt(rm.role.permissions);
  }, 0n);

  // Check administrator
  if (PermissionUtils.has(permissions, Permissions.ADMINISTRATOR)) {
    return true;
  }

  // Check specific permission
  return PermissionUtils.has(permissions, permission);
}

function extractMentions(content: string): {
  users: string[];
  roles: string[];
  channels: string[];
} {
  const mentions = {
    users: [] as string[],
    roles: [] as string[],
    channels: [] as string[],
  };

  // Extract user mentions: <@userId> or <@!userId>
  const userMentions = content.matchAll(/<@!?(\d+)>/g);
  for (const match of userMentions) {
    mentions.users.push(match[1]);
  }

  // Extract role mentions: <@&roleId>
  const roleMentions = content.matchAll(/<@&(\d+)>/g);
  for (const match of roleMentions) {
    mentions.roles.push(match[1]);
  }

  // Extract channel mentions: <#channelId>
  const channelMentions = content.matchAll(/<#(\d+)>/g);
  for (const match of channelMentions) {
    mentions.channels.push(match[1]);
  }

  return mentions;
}

async function createMentionNotifications(message: any, mentions: any): Promise<void> {
  // Create notifications for mentioned users
  for (const userId of mentions.users) {
    if (userId === message.authorId.toString()) continue;

    await prisma.notifications.create({
      data: {
        userId: BigInt(userId),
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
  }

  // Create notifications for role mentions
  for (const roleId of mentions.roles) {
    // Get all members with this role
    const members = await prisma.roleMembers.findMany({
      where: { roleId: BigInt(roleId) },
      include: { serverMember: true },
    });

    for (const member of members) {
      if (member.serverMember.userId === message.authorId) continue;

      await prisma.notifications.create({
        data: {
          userId: member.serverMember.userId,
          type: 'role_ping',
          title: 'Role Mention',
          body: `You were mentioned in ${message.channel.name}`,
          data: {
            messageId: message.id.toString(),
            channelId: message.channelId.toString(),
          },
          sourceUserId: message.authorId,
          sourceChannelId: message.channelId,
        },
      });
    }
  }
}
