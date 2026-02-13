// ============================================================
// AUTHENTICATION SERVICE
// Handles login, registration, 2FA, token management
// ============================================================

import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  hashToken,
  generateTOTPSecret,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  generateDeviceFingerprint,
} from '@/shared/utils/crypto';
import { snowflake } from '@/shared/utils/snowflake';
import { config } from '@/config/env';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Types
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  dateOfBirth?: Date;
}

export interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
  backupCode?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    snowflakeId: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    locale: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    status: string;
    subscriptionTier: string;
    createdAt: Date;
  };
  tokens: TokenPair;
  sessionId: string;
}

// Validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{2,32}$/;
const PASSWORD_MIN_LENGTH = 8;

/**
 * Validate registration data
 */
function validateRegisterData(data: RegisterData): void {
  const errors: Record<string, string[]> = {};

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.email = ['Please provide a valid email address'];
  }

  if (!data.username || !USERNAME_REGEX.test(data.username)) {
    errors.username = [
      'Username must be 2-32 characters and contain only letters, numbers, and underscores',
    ];
  }

  if (!data.password || data.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = [`Password must be at least ${PASSWORD_MIN_LENGTH} characters`];
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed') as any;
    error.name = 'ValidationError';
    error.errors = errors;
    throw error;
  }
}

/**
 * Register a new user
 */
export async function register(
  data: RegisterData,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse> {
  // Validate input
  validateRegisterData(data);

  // Check if email exists
  const existingEmail = await prisma.users.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingEmail) {
    const error = new Error('Email already registered') as any;
    error.name = 'ValidationError';
    error.errors = { email: ['This email is already registered'] };
    throw error;
  }

  // Check if username exists
  const existingUsername = await prisma.users.findFirst({
    where: { username: data.username.toLowerCase() },
  });

  if (existingUsername) {
    const error = new Error('Username taken') as any;
    error.name = 'ValidationError';
    error.errors = { username: ['This username is already taken'] };
    throw error;
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Generate snowflake ID
  const snowflakeId = snowflake.generate();

  // Create user
  const user = await prisma.users.create({
    data: {
      snowflakeId,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      displayName: data.username,
      passwordHash,
      locale: 'en-US',
      status: 'offline',
      subscriptionTier: 'free',
      uploadQuotaBytes: BigInt(104857600), // 100MB
    },
  });

  // Create session
  const session = await createSession(user.id, ipAddress, userAgent);

  // Generate tokens
  const tokens = generateTokens(user.id.toString(), session.id);

  return {
    user: formatUserResponse(user),
    tokens,
    sessionId: session.id,
  };
}

/**
 * Login user
 */
export async function login(
  data: LoginData,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse | { requires2FA: true; tempToken: string }> {
  // Find user by email
  const user = await prisma.users.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user || user.isDeleted) {
    const error = new Error('Invalid credentials') as any;
    error.name = 'AuthenticationError';
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Verify password
  const passwordValid = await verifyPassword(data.password, user.passwordHash);

  if (!passwordValid) {
    // Log failed attempt
    await logFailedLogin(user.id, ipAddress, userAgent);

    const error = new Error('Invalid credentials') as any;
    error.name = 'AuthenticationError';
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Check for suspicious login
  const isSuspicious = await checkSuspiciousLogin(user.id, ipAddress, userAgent);

  // Handle 2FA
  if (user.twoFactorEnabled) {
    if (!data.twoFactorCode && !data.backupCode) {
      // Generate temp token for 2FA
      const tempToken = generateToken();
      await redis.setex(
        `2fa:temp:${tempToken}`,
        300, // 5 minutes
        user.id.toString()
      );

      return { requires2FA: true, tempToken };
    }

    // Verify 2FA code
    if (data.twoFactorCode) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: data.twoFactorCode,
        window: 2,
      });

      if (!verified) {
        const error = new Error('Invalid 2FA code') as any;
        error.name = 'AuthenticationError';
        error.code = 'INVALID_2FA';
        throw error;
      }
    } else if (data.backupCode) {
      // Verify backup code
      const hashedCodes = user.backupCodes || [];
      if (!verifyBackupCode(data.backupCode, hashedCodes)) {
        const error = new Error('Invalid backup code') as any;
        error.name = 'AuthenticationError';
        error.code = 'INVALID_BACKUP_CODE';
        throw error;
      }

      // Remove used backup code
      const normalizedCode = data.backupCode.replace(/-/g, '').toUpperCase();
      const codeHash = hashBackupCode(normalizedCode);
      await prisma.users.update({
        where: { id: user.id },
        data: {
          backupCodes: {
            set: hashedCodes.filter((c) => c !== codeHash),
          },
        },
      });
    }
  }

  // Update last seen
  await prisma.users.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  // Create session
  const session = await createSession(user.id, ipAddress, userAgent, isSuspicious);

  // Generate tokens
  const tokens = generateTokens(user.id.toString(), session.id);

  // Log successful login
  await logSuccessfulLogin(user.id, ipAddress, userAgent);

  return {
    user: formatUserResponse(user),
    tokens,
    sessionId: session.id,
  };
}

/**
 * Complete 2FA login
 */
export async function complete2FALogin(
  tempToken: string,
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse> {
  const userId = await redis.get(`2fa:temp:${tempToken}`);

  if (!userId) {
    const error = new Error('2FA session expired') as any;
    error.name = 'AuthenticationError';
    error.code = '2FA_EXPIRED';
    throw error;
  }

  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) },
  });

  if (!user || !user.twoFactorEnabled) {
    const error = new Error('Invalid 2FA session') as any;
    error.name = 'AuthenticationError';
    error.code = 'INVALID_2FA_SESSION';
    throw error;
  }

  // Verify TOTP code
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret!,
    encoding: 'base32',
    token: code,
    window: 2,
  });

  if (!verified) {
    const error = new Error('Invalid 2FA code') as any;
    error.name = 'AuthenticationError';
    error.code = 'INVALID_2FA';
    throw error;
  }

  // Delete temp token
  await redis.del(`2fa:temp:${tempToken}`);

  // Create session
  const session = await createSession(user.id, ipAddress, userAgent);

  // Generate tokens
  const tokens = generateTokens(user.id.toString(), session.id);

  return {
    user: formatUserResponse(user),
    tokens,
    sessionId: session.id,
  };
}

/**
 * Refresh access token
 */
export async function refreshToken(
  refreshToken: string
): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.userSessions.findFirst({
    where: {
      refreshTokenHash: tokenHash,
      revokedAt: null,
    },
  });

  if (!session || new Date() > session.expiresAt) {
    const error = new Error('Invalid or expired refresh token') as any;
    error.name = 'AuthenticationError';
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  // Rotate refresh token
  const newRefreshToken = generateToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);

  await prisma.userSessions.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      lastActiveAt: new Date(),
    },
  });

  // Generate new tokens
  const accessToken = generateAccessToken({
    userId: session.userId.toString(),
    sessionId: session.id,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900, // 15 minutes
  };
}

/**
 * Logout user (revoke session)
 */
export async function logout(sessionId: string): Promise<void> {
  await prisma.userSessions.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date(),
      revokedReason: 'user_logout',
    },
  });
}

/**
 * Logout all sessions for user
 */
export async function logoutAll(userId: bigint, exceptSessionId?: string): Promise<void> {
  await prisma.userSessions.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId && { id: { not: exceptSessionId } }),
    },
    data: {
      revokedAt: new Date(),
      revokedReason: 'logout_all',
    },
  });
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId: bigint): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  const secret = speakeasy.generateSecret({
    name: 'Commune',
    length: 32,
  });

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);
  const hashedBackupCodes = backupCodes.map(hashBackupCode);

  // Save to user
  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret.base32,
      backupCodes: hashedBackupCodes,
    },
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify and enable 2FA
 */
export async function verifyAndEnable2FA(
  userId: bigint,
  code: string
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user?.twoFactorSecret) {
    const error = new Error('2FA not initialized') as any;
    error.name = 'ValidationError';
    throw error;
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 2,
  });

  if (!verified) {
    const error = new Error('Invalid 2FA code') as any;
    error.name = 'ValidationError';
    error.errors = { code: ['Invalid verification code'] };
    throw error;
  }

  await prisma.users.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });
}

/**
 * Disable 2FA
 */
export async function disable2FA(userId: bigint, password: string): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    const error = new Error('Invalid password') as any;
    error.name = 'ValidationError';
    error.errors = { password: ['Invalid password'] };
    throw error;
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    },
  });
}

/**
 * Change password
 */
export async function changePassword(
  userId: bigint,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const passwordValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!passwordValid) {
    const error = new Error('Invalid current password') as any;
    error.name = 'ValidationError';
    error.errors = { currentPassword: ['Invalid current password'] };
    throw error;
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    const error = new Error('Password too short') as any;
    error.name = 'ValidationError';
    error.errors = {
      newPassword: [`Password must be at least ${PASSWORD_MIN_LENGTH} characters`],
    };
    throw error;
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.users.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  // Revoke all sessions except current
  await logoutAll(userId);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function createSession(
  userId: bigint,
  ipAddress?: string,
  userAgent?: string,
  isSuspicious: boolean = false
) {
  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);

  // Parse user agent
  const deviceInfo = parseUserAgent(userAgent);

  const session = await prisma.userSessions.create({
    data: {
      userId,
      refreshTokenHash,
      deviceFingerprint: ipAddress && userAgent
        ? generateDeviceFingerprint(userAgent, ipAddress)
        : undefined,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      ipAddress: ipAddress || undefined,
      isTrusted: !isSuspicious,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return session;
}

function generateTokens(userId: string, sessionId: string): TokenPair {
  const accessToken = generateAccessToken({ userId, sessionId });
  const refreshToken = generateRefreshToken({ userId, sessionId });

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes
  };
}

function formatUserResponse(user: any) {
  return {
    id: user.id.toString(),
    snowflakeId: user.snowflakeId.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    locale: user.locale,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    status: user.status,
    subscriptionTier: user.subscriptionTier,
    createdAt: user.createdAt,
  };
}

function parseUserAgent(userAgent?: string): {
  deviceName?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
} {
  if (!userAgent) {
    return {};
  }

  const result: any = {};

  // Detect OS
  if (userAgent.includes('Windows')) {
    result.os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    result.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    result.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    result.os = 'Android';
    result.deviceType = 'mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    result.os = 'iOS';
    result.deviceType = userAgent.includes('iPad') ? 'tablet' : 'mobile';
  }

  // Detect browser
  if (userAgent.includes('Chrome')) {
    result.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    result.browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    result.browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    result.browser = 'Edge';
  }

  // Device type fallback
  if (!result.deviceType) {
    result.deviceType = 'desktop';
  }

  result.deviceName = `${result.os} ${result.browser}`;

  return result;
}

async function checkSuspiciousLogin(
  userId: bigint,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  if (!ipAddress || !userAgent) {
    return false;
  }

  const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);

  // Check if this fingerprint exists in user's sessions
  const existingSession = await prisma.userSessions.findFirst({
    where: {
      userId,
      deviceFingerprint: fingerprint,
      revokedAt: null,
    },
  });

  return !existingSession;
}

async function logFailedLogin(
  userId: bigint,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Store failed attempt in Redis for rate limiting
  const key = `login:failed:${userId}`;
  await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour

  // Could also log to database for security audit
}

async function logSuccessfulLogin(
  userId: bigint,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Clear failed attempts
  const key = `login:failed:${userId}`;
  await redis.del(key);
}
