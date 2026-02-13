// ============================================================
// SHARED TYPES - Commune Platform
// ============================================================

// User Types
export interface User {
  id: bigint;
  snowflakeId: bigint;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  locale: string;
  timezone: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
  customStatus?: string;
  lastSeenAt: Date;
  createdAt: Date;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  uploadQuotaBytes: bigint;
  uploadUsedBytes: bigint;
}

export interface UserSession {
  id: string;
  userId: bigint;
  deviceFingerprint?: string;
  deviceName?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  ipAddress?: string;
  location?: string;
  isTrusted: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

// Server Types
export interface Server {
  id: bigint;
  snowflakeId: bigint;
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  ownerId: bigint;
  defaultChannelId?: bigint;
  systemChannelId?: bigint;
  rulesChannelId?: bigint;
  verificationLevel: number;
  defaultMessageNotifications: number;
  explicitContentFilter: number;
  vanityUrlCode?: string;
  premiumTier: number;
  premiumSubscriptionCount: number;
  maxMembers: number;
  approximateMemberCount: number;
  approximatePresenceCount: number;
  isPublic: boolean;
  isDiscoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerMember {
  id: bigint;
  serverId: bigint;
  userId: bigint;
  nickname?: string;
  avatarUrl?: string;
  joinedAt: Date;
  premiumSince?: Date;
  isDeafened: boolean;
  isMuted: boolean;
  pending: boolean;
  communicationDisabledUntil?: Date;
  roles: Role[];
  user?: User;
}

// Role Types
export interface Role {
  id: bigint;
  snowflakeId: bigint;
  serverId: bigint;
  name: string;
  color: number;
  hoist: boolean;
  iconUrl?: string;
  unicodeEmoji?: string;
  position: number;
  permissions: bigint;
  isMentionable: boolean;
  isDefault: boolean;
  createdAt: Date;
}

// Channel Types
export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_ANNOUNCEMENT = 5,
  ANNOUNCEMENT_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
}

export interface Channel {
  id: bigint;
  snowflakeId: bigint;
  serverId?: bigint;
  parentId?: bigint;
  creatorId?: bigint;
  name: string;
  type: ChannelType;
  topic?: string;
  iconUrl?: string;
  position: number;
  permissionOverwrites: PermissionOverwrite[];
  isNsfw: boolean;
  rateLimitPerUser: number;
  bitrate?: number;
  userLimit?: number;
  rtcRegion?: string;
  videoQualityMode: number;
  lastMessageId?: bigint;
  lastPinTimestamp?: Date;
  defaultAutoArchiveDuration: number;
  createdAt: Date;
}

export interface PermissionOverwrite {
  id: bigint;
  type: 'role' | 'member';
  allow: bigint;
  deny: bigint;
}

// Message Types
export interface Message {
  id: bigint;
  snowflakeId: bigint;
  channelId: bigint;
  authorId?: bigint;
  webhookId?: bigint;
  content?: string;
  timestamp: Date;
  editedTimestamp?: Date;
  editCount: number;
  editHistory: MessageEdit[];
  isPinned: boolean;
  tts: boolean;
  mentionEveryone: boolean;
  mentions: Mention[];
  mentionRoles: bigint[];
  mentionChannels: bigint[];
  attachments: Attachment[];
  embeds: Embed[];
  reactions: Reaction[];
  nonce?: string;
  messageReference?: MessageReference;
  referencedMessageId?: bigint;
  referencedMessage?: Message;
  threadId?: bigint;
  components: any[];
  stickerItems: any[];
  flags: number;
  isDeleted: boolean;
  author?: User;
}

export interface MessageEdit {
  content: string;
  editedAt: Date;
}

export interface Mention {
  id: bigint;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface MessageReference {
  messageId: bigint;
  channelId: bigint;
  serverId?: bigint;
}

// Attachment Types
export interface Attachment {
  id: bigint;
  snowflakeId: bigint;
  messageId?: bigint;
  filename: string;
  contentType?: string;
  sizeBytes: bigint;
  url: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
  durationSecs?: number;
  description?: string;
  isSpoiler: boolean;
  thumbnailUrl?: string;
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'error';
}

// Embed Types
export interface Embed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: Date;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  video?: EmbedVideo;
  provider?: EmbedProvider;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface EmbedFooter {
  text: string;
  iconUrl?: string;
  proxyIconUrl?: string;
}

export interface EmbedImage {
  url: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
}

export interface EmbedThumbnail {
  url: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
}

export interface EmbedVideo {
  url?: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
}

export interface EmbedProvider {
  name?: string;
  url?: string;
}

export interface EmbedAuthor {
  name?: string;
  url?: string;
  iconUrl?: string;
  proxyIconUrl?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

// Reaction Types
export interface Reaction {
  id: bigint;
  messageId: bigint;
  channelId: bigint;
  userId: bigint;
  emojiId?: bigint;
  emojiName?: string;
  emojiAnimated: boolean;
  count: number;
  me: boolean;
}

// Voice Types
export interface VoiceSession {
  id: bigint;
  channelId: bigint;
  userId: bigint;
  sessionId: string;
  token: string;
  endpoint?: string;
  isDeafened: boolean;
  isMuted: boolean;
  isSelfDeafened: boolean;
  isSelfMuted: boolean;
  isStreaming: boolean;
  isVideoEnabled: boolean;
  isSuppressed: boolean;
  requestToSpeakTimestamp?: Date;
  joinedAt: Date;
}

export interface VoiceState {
  userId: bigint;
  guildId?: bigint;
  channelId?: bigint;
  sessionId?: string;
  isDeafened: boolean;
  isMuted: boolean;
  isSelfDeafened: boolean;
  isSelfMuted: boolean;
  isStreaming: boolean;
  isVideoEnabled: boolean;
  isSuppressed: boolean;
  requestToSpeakTimestamp?: Date;
}

// Notification Types
export interface Notification {
  id: bigint;
  userId: bigint;
  type: 'mention' | 'reply' | 'dm' | 'invite' | 'role_ping' | 'system' | 'friend_request' | 'call';
  title?: string;
  body?: string;
  iconUrl?: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  sourceUserId?: bigint;
  sourceChannelId?: bigint;
  sourceServerId?: bigint;
  sourceMessageId?: bigint;
  createdAt: Date;
}

// Subscription Types
export interface Subscription {
  id: bigint;
  userId?: bigint;
  serverId?: bigint;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  tier: 'free' | 'premium' | 'premium_plus' | 'enterprise';
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log Types
export interface AuditLog {
  id: bigint;
  serverId?: bigint;
  actionType: AuditLogEvent;
  userId?: bigint;
  targetId?: bigint;
  targetType?: string;
  changes: AuditLogChange[];
  options?: Record<string, any>;
  reason?: string;
  createdAt: Date;
}

export enum AuditLogEvent {
  GUILD_UPDATE = 1,
  CHANNEL_CREATE = 10,
  CHANNEL_UPDATE = 11,
  CHANNEL_DELETE = 12,
  CHANNEL_OVERWRITE_CREATE = 13,
  CHANNEL_OVERWRITE_UPDATE = 14,
  CHANNEL_OVERWRITE_DELETE = 15,
  MEMBER_KICK = 20,
  MEMBER_PRUNE = 21,
  MEMBER_BAN_ADD = 22,
  MEMBER_BAN_REMOVE = 23,
  MEMBER_UPDATE = 24,
  MEMBER_ROLE_UPDATE = 25,
  MEMBER_MOVE = 26,
  MEMBER_DISCONNECT = 27,
  BOT_ADD = 28,
  ROLE_CREATE = 30,
  ROLE_UPDATE = 31,
  ROLE_DELETE = 32,
  INVITE_CREATE = 40,
  INVITE_UPDATE = 41,
  INVITE_DELETE = 42,
  WEBHOOK_CREATE = 50,
  WEBHOOK_UPDATE = 51,
  WEBHOOK_DELETE = 52,
  EMOJI_CREATE = 60,
  EMOJI_UPDATE = 61,
  EMOJI_DELETE = 62,
  MESSAGE_DELETE = 72,
  MESSAGE_BULK_DELETE = 73,
  MESSAGE_PIN = 74,
  MESSAGE_UNPIN = 75,
  INTEGRATION_CREATE = 80,
  INTEGRATION_UPDATE = 81,
  INTEGRATION_DELETE = 82,
  STAGE_INSTANCE_CREATE = 83,
  STAGE_INSTANCE_UPDATE = 84,
  STAGE_INSTANCE_DELETE = 85,
  STICKER_CREATE = 90,
  STICKER_UPDATE = 91,
  STICKER_DELETE = 92,
  GUILD_SCHEDULED_EVENT_CREATE = 100,
  GUILD_SCHEDULED_EVENT_UPDATE = 101,
  GUILD_SCHEDULED_EVENT_DELETE = 102,
  THREAD_CREATE = 110,
  THREAD_UPDATE = 111,
  THREAD_DELETE = 112,
}

export interface AuditLogChange {
  key: string;
  oldValue?: any;
  newValue?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// WebSocket Event Types
export interface WebSocketEvent {
  op: number;
  d?: any;
  s?: number;
  t?: string;
}

export enum GatewayOpcodes {
  DISPATCH = 0,
  HEARTBEAT = 1,
  IDENTIFY = 2,
  PRESENCE_UPDATE = 3,
  VOICE_STATE_UPDATE = 4,
  VOICE_GUILD_PING = 5,
  RESUME = 6,
  RECONNECT = 7,
  REQUEST_GUILD_MEMBERS = 8,
  INVALID_SESSION = 9,
  HELLO = 10,
  HEARTBEAT_ACK = 11,
}

export enum GatewayCloseCodes {
  UNKNOWN_ERROR = 4000,
  UNKNOWN_OPCODE = 4001,
  DECODE_ERROR = 4002,
  NOT_AUTHENTICATED = 4003,
  AUTHENTICATION_FAILED = 4004,
  ALREADY_AUTHENTICATED = 4005,
  INVALID_SEQ = 4007,
  RATE_LIMITED = 4008,
  SESSION_TIMED_OUT = 4009,
  INVALID_SHARD = 4010,
  SHARDING_REQUIRED = 4011,
  INVALID_API_VERSION = 4012,
  INVALID_INTENTS = 4013,
  DISALLOWED_INTENTS = 4014,
}

// Presence Types
export interface Presence {
  userId: bigint;
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
  customStatus?: string;
  clientStatus?: {
    desktop?: string;
    mobile?: string;
    web?: string;
  };
  activities: Activity[];
  lastSeenAt: Date;
}

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  url?: string;
  createdAt: Date;
  timestamps?: {
    start?: number;
    end?: number;
  };
  applicationId?: bigint;
  details?: string;
  state?: string;
  emoji?: {
    name?: string;
    id?: bigint;
    animated?: boolean;
  };
  party?: {
    id?: string;
    size?: [number, number];
  };
  assets?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
  };
  secrets?: {
    join?: string;
    spectate?: string;
    match?: string;
  };
  instance?: boolean;
  flags?: number;
}

export enum ActivityType {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  CUSTOM = 4,
  COMPETING = 5,
}
