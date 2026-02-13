// ============================================================
// PERMISSIONS SYSTEM - Bitwise Flags
// Based on Discord's permission system for enterprise scalability
// ============================================================

// Permission bitfield values (BigInt for 64-bit support)
export const Permissions = {
  // General Server Permissions
  CREATE_INSTANT_INVITE: 1n << 0n,      // 0x0000000000000001
  KICK_MEMBERS: 1n << 1n,               // 0x0000000000000002
  BAN_MEMBERS: 1n << 2n,                // 0x0000000000000004
  ADMINISTRATOR: 1n << 3n,              // 0x0000000000000008
  MANAGE_CHANNELS: 1n << 4n,            // 0x0000000000000010
  MANAGE_GUILD: 1n << 5n,               // 0x0000000000000020
  VIEW_AUDIT_LOG: 1n << 7n,             // 0x0000000000000080
  VIEW_GUILD_INSIGHTS: 1n << 19n,       // 0x0000000000080000
  MODIFY_GUILD_PROFILE: 1n << 33n,      // 0x0000000200000000
  MODERATE_MEMBERS: 1n << 40n,          // 0x0000010000000000

  // Text Channel Permissions
  ADD_REACTIONS: 1n << 6n,              // 0x0000000000000040
  VIEW_CHANNEL: 1n << 10n,              // 0x0000000000000400
  SEND_MESSAGES: 1n << 11n,             // 0x0000000000000800
  SEND_TTS_MESSAGES: 1n << 12n,         // 0x0000000000001000
  MANAGE_MESSAGES: 1n << 13n,           // 0x0000000000002000
  EMBED_LINKS: 1n << 14n,               // 0x0000000000004000
  ATTACH_FILES: 1n << 15n,              // 0x0000000000008000
  READ_MESSAGE_HISTORY: 1n << 16n,      // 0x0000000000010000
  MENTION_EVERYONE: 1n << 17n,          // 0x0000000000020000
  USE_EXTERNAL_EMOJIS: 1n << 18n,       // 0x0000000000040000
  USE_APPLICATION_COMMANDS: 1n << 31n,  // 0x0000000080000000
  CREATE_PUBLIC_THREADS: 1n << 35n,     // 0x0000000800000000
  CREATE_PRIVATE_THREADS: 1n << 36n,    // 0x0000001000000000
  USE_EXTERNAL_STICKERS: 1n << 37n,     // 0x0000002000000000
  SEND_MESSAGES_IN_THREADS: 1n << 38n,  // 0x0000004000000000
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,   // 0x0000008000000000

  // Voice Channel Permissions
  CONNECT: 1n << 20n,                   // 0x0000000000100000
  SPEAK: 1n << 21n,                     // 0x0000000000200000
  MUTE_MEMBERS: 1n << 22n,              // 0x0000000000400000
  DEAFEN_MEMBERS: 1n << 23n,            // 0x0000000000800000
  MOVE_MEMBERS: 1n << 24n,              // 0x0000000001000000
  USE_VAD: 1n << 25n,                   // 0x0000000002000000
  PRIORITY_SPEAKER: 1n << 8n,           // 0x0000000000000100
  STREAM: 1n << 9n,                     // 0x0000000000000200
  REQUEST_TO_SPEAK: 1n << 32n,          // 0x0000000100000000
  START_EMBEDDED_ACTIVITIES: 1n << 39n, // 0x0000008000000000

  // Advanced Permissions
  MANAGE_WEBHOOKS: 1n << 29n,           // 0x0000000040000000
  MANAGE_GUILD_EXPRESSIONS: 1n << 30n,  // 0x0000000080000000
  MANAGE_EVENTS: 1n << 33n,             // 0x0000000200000000
  MANAGE_THREADS: 1n << 34n,            // 0x0000000400000000
  CREATE_GUILD_EXPRESSIONS: 1n << 43n,  // 0x0000080000000000
  CREATE_EVENTS: 1n << 44n,             // 0x0000100000000000

  // Monetization Permissions
  USE_SOUNDBOARD: 1n << 42n,            // 0x0000040000000000
  USE_EXTERNAL_SOUNDS: 1n << 45n,       // 0x0000200000000000
  SEND_VOICE_MESSAGES: 1n << 46n,       // 0x0000400000000000

  // Special
  ALL: 1n << 0n | 1n << 1n | 1n << 2n | 1n << 3n | 1n << 4n | 1n << 5n |
       1n << 6n | 1n << 7n | 1n << 8n | 1n << 9n | 1n << 10n | 1n << 11n |
       1n << 12n | 1n << 13n | 1n << 14n | 1n << 15n | 1n << 16n | 1n << 17n |
       1n << 18n | 1n << 19n | 1n << 20n | 1n << 21n | 1n << 22n | 1n << 23n |
       1n << 24n | 1n << 25n | 1n << 29n | 1n << 30n | 1n << 31n | 1n << 32n |
       1n << 33n | 1n << 34n | 1n << 35n | 1n << 36n | 1n << 37n | 1n << 38n |
       1n << 39n | 1n << 40n | 1n << 42n | 1n << 43n | 1n << 44n | 1n << 45n | 1n << 46n,

  NONE: 0n,
} as const;

// Permission groups for common use cases
export const PermissionGroups = {
  // Everyone role default permissions
  EVERYONE: [
    Permissions.CREATE_INSTANT_INVITE,
    Permissions.ADD_REACTIONS,
    Permissions.VIEW_CHANNEL,
    Permissions.SEND_MESSAGES,
    Permissions.EMBED_LINKS,
    Permissions.ATTACH_FILES,
    Permissions.READ_MESSAGE_HISTORY,
    Permissions.USE_EXTERNAL_EMOJIS,
    Permissions.USE_APPLICATION_COMMANDS,
    Permissions.CONNECT,
    Permissions.SPEAK,
    Permissions.USE_VAD,
    Permissions.STREAM,
    Permissions.REQUEST_TO_SPEAK,
    Permissions.CREATE_PUBLIC_THREADS,
    Permissions.SEND_MESSAGES_IN_THREADS,
    Permissions.USE_EMBEDDED_ACTIVITIES,
  ],

  // Moderator permissions
  MODERATOR: [
    Permissions.KICK_MEMBERS,
    Permissions.BAN_MEMBERS,
    Permissions.MANAGE_MESSAGES,
    Permissions.MUTE_MEMBERS,
    Permissions.DEAFEN_MEMBERS,
    Permissions.MOVE_MEMBERS,
    Permissions.MODERATE_MEMBERS,
    Permissions.MANAGE_THREADS,
    Permissions.VIEW_AUDIT_LOG,
  ],

  // Administrator permissions (excludes ADMINISTRATOR flag)
  ADMINISTRATOR_WITHOUT_FLAG: [
    Permissions.MANAGE_GUILD,
    Permissions.MANAGE_CHANNELS,
    Permissions.MANAGE_WEBHOOKS,
    Permissions.MANAGE_GUILD_EXPRESSIONS,
    Permissions.MANAGE_EVENTS,
    Permissions.VIEW_GUILD_INSIGHTS,
    Permissions.MODIFY_GUILD_PROFILE,
  ],

  // Voice channel specific
  VOICE_ALL: [
    Permissions.CONNECT,
    Permissions.SPEAK,
    Permissions.MUTE_MEMBERS,
    Permissions.DEAFEN_MEMBERS,
    Permissions.MOVE_MEMBERS,
    Permissions.USE_VAD,
    Permissions.PRIORITY_SPEAKER,
    Permissions.STREAM,
    Permissions.REQUEST_TO_SPEAK,
  ],

  // Text channel specific
  TEXT_ALL: [
    Permissions.SEND_MESSAGES,
    Permissions.SEND_TTS_MESSAGES,
    Permissions.EMBED_LINKS,
    Permissions.ATTACH_FILES,
    Permissions.ADD_REACTIONS,
    Permissions.MANAGE_MESSAGES,
    Permissions.READ_MESSAGE_HISTORY,
    Permissions.MENTION_EVERYONE,
    Permissions.USE_EXTERNAL_EMOJIS,
    Permissions.USE_APPLICATION_COMMANDS,
    Permissions.CREATE_PUBLIC_THREADS,
    Permissions.CREATE_PRIVATE_THREADS,
    Permissions.USE_EXTERNAL_STICKERS,
    Permissions.SEND_MESSAGES_IN_THREADS,
    Permissions.MANAGE_THREADS,
  ],
};

// Default role permissions (everyone gets these)
export const DEFAULT_ROLE_PERMISSIONS = PermissionGroups.EVERYONE.reduce(
  (acc, perm) => acc | perm,
  Permissions.NONE
);

// Permission names for display
export const PermissionNames: Record<string, string> = {
  [Permissions.CREATE_INSTANT_INVITE.toString()]: 'Create Invite',
  [Permissions.KICK_MEMBERS.toString()]: 'Kick Members',
  [Permissions.BAN_MEMBERS.toString()]: 'Ban Members',
  [Permissions.ADMINISTRATOR.toString()]: 'Administrator',
  [Permissions.MANAGE_CHANNELS.toString()]: 'Manage Channels',
  [Permissions.MANAGE_GUILD.toString()]: 'Manage Server',
  [Permissions.ADD_REACTIONS.toString()]: 'Add Reactions',
  [Permissions.VIEW_AUDIT_LOG.toString()]: 'View Audit Log',
  [Permissions.PRIORITY_SPEAKER.toString()]: 'Priority Speaker',
  [Permissions.STREAM.toString()]: 'Video',
  [Permissions.VIEW_CHANNEL.toString()]: 'View Channel',
  [Permissions.SEND_MESSAGES.toString()]: 'Send Messages',
  [Permissions.SEND_TTS_MESSAGES.toString()]: 'Send TTS Messages',
  [Permissions.MANAGE_MESSAGES.toString()]: 'Manage Messages',
  [Permissions.EMBED_LINKS.toString()]: 'Embed Links',
  [Permissions.ATTACH_FILES.toString()]: 'Attach Files',
  [Permissions.READ_MESSAGE_HISTORY.toString()]: 'Read History',
  [Permissions.MENTION_EVERYONE.toString()]: 'Mention @everyone',
  [Permissions.USE_EXTERNAL_EMOJIS.toString()]: 'Use External Emojis',
  [Permissions.VIEW_GUILD_INSIGHTS.toString()]: 'View Insights',
  [Permissions.CONNECT.toString()]: 'Connect',
  [Permissions.SPEAK.toString()]: 'Speak',
  [Permissions.MUTE_MEMBERS.toString()]: 'Mute Members',
  [Permissions.DEAFEN_MEMBERS.toString()]: 'Deafen Members',
  [Permissions.MOVE_MEMBERS.toString()]: 'Move Members',
  [Permissions.USE_VAD.toString()]: 'Use Voice Activity',
  [Permissions.MANAGE_WEBHOOKS.toString()]: 'Manage Webhooks',
  [Permissions.MANAGE_GUILD_EXPRESSIONS.toString()]: 'Manage Expressions',
  [Permissions.USE_APPLICATION_COMMANDS.toString()]: 'Use Commands',
  [Permissions.REQUEST_TO_SPEAK.toString()]: 'Request to Speak',
  [Permissions.MANAGE_EVENTS.toString()]: 'Manage Events',
  [Permissions.MANAGE_THREADS.toString()]: 'Manage Threads',
  [Permissions.CREATE_PUBLIC_THREADS.toString()]: 'Create Public Threads',
  [Permissions.CREATE_PRIVATE_THREADS.toString()]: 'Create Private Threads',
  [Permissions.USE_EXTERNAL_STICKERS.toString()]: 'Use External Stickers',
  [Permissions.SEND_MESSAGES_IN_THREADS.toString()]: 'Send in Threads',
  [Permissions.USE_EMBEDDED_ACTIVITIES.toString()]: 'Use Activities',
  [Permissions.MODERATE_MEMBERS.toString()]: 'Timeout Members',
  [Permissions.USE_SOUNDBOARD.toString()]: 'Use Soundboard',
  [Permissions.CREATE_GUILD_EXPRESSIONS.toString()]: 'Create Expressions',
  [Permissions.CREATE_EVENTS.toString()]: 'Create Events',
  [Permissions.USE_EXTERNAL_SOUNDS.toString()]: 'Use External Sounds',
  [Permissions.SEND_VOICE_MESSAGES.toString()]: 'Send Voice Messages',
};

// Permission descriptions
export const PermissionDescriptions: Record<string, string> = {
  [Permissions.CREATE_INSTANT_INVITE.toString()]: 'Allows creating invites for the server',
  [Permissions.KICK_MEMBERS.toString()]: 'Allows kicking members from the server',
  [Permissions.BAN_MEMBERS.toString()]: 'Allows banning members from the server',
  [Permissions.ADMINISTRATOR.toString()]: 'Grants all permissions and bypasses channel permissions',
  [Permissions.MANAGE_CHANNELS.toString()]: 'Allows creating, editing, and deleting channels',
  [Permissions.MANAGE_GUILD.toString()]: 'Allows managing server settings',
  [Permissions.ADD_REACTIONS.toString()]: 'Allows adding reactions to messages',
  [Permissions.VIEW_AUDIT_LOG.toString()]: 'Allows viewing the server audit log',
  [Permissions.PRIORITY_SPEAKER.toString()]: 'Allows speaking with priority in voice channels',
  [Permissions.STREAM.toString()]: 'Allows streaming video in voice channels',
  [Permissions.VIEW_CHANNEL.toString()]: 'Allows viewing channels',
  [Permissions.SEND_MESSAGES.toString()]: 'Allows sending messages in text channels',
  [Permissions.SEND_TTS_MESSAGES.toString()]: 'Allows sending text-to-speech messages',
  [Permissions.MANAGE_MESSAGES.toString()]: 'Allows deleting and pinning messages',
  [Permissions.EMBED_LINKS.toString()]: 'Allows embedding links with previews',
  [Permissions.ATTACH_FILES.toString()]: 'Allows uploading files',
  [Permissions.READ_MESSAGE_HISTORY.toString()]: 'Allows reading message history',
  [Permissions.MENTION_EVERYONE.toString()]: 'Allows mentioning @everyone and @here',
  [Permissions.USE_EXTERNAL_EMOJIS.toString()]: 'Allows using emojis from other servers',
  [Permissions.VIEW_GUILD_INSIGHTS.toString()]: 'Allows viewing server insights',
  [Permissions.CONNECT.toString()]: 'Allows connecting to voice channels',
  [Permissions.SPEAK.toString()]: 'Allows speaking in voice channels',
  [Permissions.MUTE_MEMBERS.toString()]: 'Allows muting members in voice channels',
  [Permissions.DEAFEN_MEMBERS.toString()]: 'Allows deafening members in voice channels',
  [Permissions.MOVE_MEMBERS.toString()]: 'Allows moving members between voice channels',
  [Permissions.USE_VAD.toString()]: 'Allows using voice activity detection',
  [Permissions.MANAGE_WEBHOOKS.toString()]: 'Allows managing webhooks',
  [Permissions.MANAGE_GUILD_EXPRESSIONS.toString()]: 'Allows managing emojis and stickers',
  [Permissions.USE_APPLICATION_COMMANDS.toString()]: 'Allows using slash commands',
  [Permissions.REQUEST_TO_SPEAK.toString()]: 'Allows requesting to speak in stage channels',
  [Permissions.MANAGE_EVENTS.toString()]: 'Allows managing events',
  [Permissions.MANAGE_THREADS.toString()]: 'Allows managing threads',
  [Permissions.CREATE_PUBLIC_THREADS.toString()]: 'Allows creating public threads',
  [Permissions.CREATE_PRIVATE_THREADS.toString()]: 'Allows creating private threads',
  [Permissions.USE_EXTERNAL_STICKERS.toString()]: 'Allows using stickers from other servers',
  [Permissions.SEND_MESSAGES_IN_THREADS.toString()]: 'Allows sending messages in threads',
  [Permissions.USE_EMBEDDED_ACTIVITIES.toString()]: 'Allows using embedded activities',
  [Permissions.MODERATE_MEMBERS.toString()]: 'Allows timing out members',
  [Permissions.USE_SOUNDBOARD.toString()]: 'Allows using soundboard in voice channels',
  [Permissions.CREATE_GUILD_EXPRESSIONS.toString()]: 'Allows creating emojis and stickers',
  [Permissions.CREATE_EVENTS.toString()]: 'Allows creating events',
  [Permissions.USE_EXTERNAL_SOUNDS.toString()]: 'Allows using sounds from other servers',
  [Permissions.SEND_VOICE_MESSAGES.toString()]: 'Allows sending voice messages',
};

// Utility functions for permission handling
export class PermissionUtils {
  /**
   * Check if a permission bitfield has a specific permission
   */
  static has(permissions: bigint, permission: bigint): boolean {
    return (permissions & permission) === permission;
  }

  /**
   * Check if a permission bitfield has any of the specified permissions
   */
  static hasAny(permissions: bigint, ...perms: bigint[]): boolean {
    return perms.some(p => this.has(permissions, p));
  }

  /**
   * Check if a permission bitfield has all of the specified permissions
   */
  static hasAll(permissions: bigint, ...perms: bigint[]): boolean {
    return perms.every(p => this.has(permissions, p));
  }

  /**
   * Add a permission to a bitfield
   */
  static add(permissions: bigint, permission: bigint): bigint {
    return permissions | permission;
  }

  /**
   * Remove a permission from a bitfield
   */
  static remove(permissions: bigint, permission: bigint): bigint {
    return permissions & ~permission;
  }

  /**
   * Toggle a permission in a bitfield
   */
  static toggle(permissions: bigint, permission: bigint): bigint {
    return permissions ^ permission;
  }

  /**
   * Check if user has administrator permission (bypasses all checks)
   */
  static isAdministrator(permissions: bigint): boolean {
    return this.has(permissions, Permissions.ADMINISTRATOR);
  }

  /**
   * Serialize permissions to string for storage
   */
  static serialize(permissions: bigint): string {
    return permissions.toString();
  }

  /**
   * Deserialize permissions from string
   */
  static deserialize(permissions: string): bigint {
    return BigInt(permissions);
  }

  /**
   * Get all permission names from a bitfield
   */
  static getPermissionNames(permissions: bigint): string[] {
    return Object.entries(Permissions)
      .filter(([key, value]) => 
        key !== 'ALL' && 
        key !== 'NONE' && 
        typeof value === 'bigint' && 
        this.has(permissions, value)
      )
      .map(([_, value]) => PermissionNames[value.toString()] || 'Unknown');
  }

  /**
   * Calculate effective permissions for a member in a channel
   */
  static calculateEffectivePermissions(
    basePermissions: bigint,
    channelOverwrites: { allow: bigint; deny: bigint }[]
  ): bigint {
    let permissions = basePermissions;

    // Apply channel overwrites
    for (const overwrite of channelOverwrites) {
      permissions = (permissions & ~overwrite.deny) | overwrite.allow;
    }

    return permissions;
  }
}

// Rate limit configurations
export const RateLimits = {
  // Authentication
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  
  // Messaging
  SEND_MESSAGE: { windowMs: 60 * 1000, maxRequests: 30 },
  EDIT_MESSAGE: { windowMs: 60 * 1000, maxRequests: 20 },
  DELETE_MESSAGE: { windowMs: 60 * 1000, maxRequests: 20 },
  ADD_REACTION: { windowMs: 60 * 1000, maxRequests: 10 },
  
  // Channel operations
  CREATE_CHANNEL: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  DELETE_CHANNEL: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  
  // Server operations
  CREATE_SERVER: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 },
  JOIN_SERVER: { windowMs: 10 * 60 * 1000, maxRequests: 10 },
  
  // General API
  DEFAULT: { windowMs: 60 * 1000, maxRequests: 100 },
};

// Subscription tier limits
export const SubscriptionLimits = {
  free: {
    maxUploadSizeMB: 25,
    maxFileUploadsPerMessage: 10,
    maxServers: 100,
    maxMembersPerServer: 250000,
    maxBitrateKbps: 64,
    animatedAvatar: false,
    customBanner: false,
    customThemes: false,
    hdStreaming: false,
  },
  premium: {
    maxUploadSizeMB: 100,
    maxFileUploadsPerMessage: 25,
    maxServers: 200,
    maxMembersPerServer: 500000,
    maxBitrateKbps: 128,
    animatedAvatar: true,
    customBanner: true,
    customThemes: true,
    hdStreaming: true,
  },
  premium_plus: {
    maxUploadSizeMB: 500,
    maxFileUploadsPerMessage: 50,
    maxServers: 500,
    maxMembersPerServer: 1000000,
    maxBitrateKbps: 256,
    animatedAvatar: true,
    customBanner: true,
    customThemes: true,
    hdStreaming: true,
  },
  enterprise: {
    maxUploadSizeMB: 2000,
    maxFileUploadsPerMessage: 100,
    maxServers: 1000,
    maxMembersPerServer: 5000000,
    maxBitrateKbps: 384,
    animatedAvatar: true,
    customBanner: true,
    customThemes: true,
    hdStreaming: true,
  },
};

// Server boost benefits
export const BoostBenefits = {
  tier0: {
    emojiSlots: 50,
    stickerSlots: 5,
    bitrateKbps: 64,
    uploadLimitMB: 25,
    streamQuality: '720p',
  },
  tier1: {
    emojiSlots: 100,
    stickerSlots: 15,
    bitrateKbps: 128,
    uploadLimitMB: 50,
    streamQuality: '1080p',
    customInviteBackground: true,
    animatedServerIcon: true,
  },
  tier2: {
    emojiSlots: 150,
    stickerSlots: 30,
    bitrateKbps: 256,
    uploadLimitMB: 100,
    streamQuality: '1080p60',
    customInviteBackground: true,
    animatedServerIcon: true,
    serverBanner: true,
    customRoleIcons: true,
  },
  tier3: {
    emojiSlots: 250,
    stickerSlots: 60,
    bitrateKbps: 384,
    uploadLimitMB: 100,
    streamQuality: '4K',
    customInviteBackground: true,
    animatedServerIcon: true,
    serverBanner: true,
    customRoleIcons: true,
    vanityUrl: true,
    animatedBanner: true,
  },
};
