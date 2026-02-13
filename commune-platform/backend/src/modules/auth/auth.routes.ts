// ============================================================
// AUTHENTICATION ROUTES
// Registration, login, 2FA, token management
// ============================================================

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateRequest, optionalAuth } from '@/shared/middleware/auth';
import {
  register,
  login,
  complete2FALogin,
  refreshToken,
  logout,
  logoutAll,
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  changePassword,
} from './auth.service';
import { config } from '@/config/env';

// Schemas
const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'username', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 2, maxLength: 32 },
      password: { type: 'string', minLength: 8 },
      dateOfBirth: { type: 'string', format: 'date' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            tokens: { type: 'object' },
            sessionId: { type: 'string' },
          },
        },
      },
    },
  },
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
      twoFactorCode: { type: 'string', pattern: '^[0-9]{6}$' },
      backupCode: { type: 'string' },
    },
  },
};

const refreshSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' },
    },
  },
};

const twoFASchema = {
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string', pattern: '^[0-9]{6}$' },
    },
  },
};

const changePasswordSchema = {
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string' },
      newPassword: { type: 'string', minLength: 8 },
    },
  },
};

/**
 * Register authentication routes
 */
export async function registerAuthRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // ============================================================
  // REGISTRATION & LOGIN
  // ============================================================

  // Register
  app.post('/register', { schema: registerSchema }, async (request, reply) => {
    const result = await register(
      request.body as any,
      request.ip,
      request.headers['user-agent']
    );

    // Set refresh token as HTTP-only cookie
    reply.setCookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.server.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });

    return reply.status(201).send({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  });

  // Login
  app.post('/login', { schema: loginSchema }, async (request, reply) => {
    const result = await login(
      request.body as any,
      request.ip,
      request.headers['user-agent']
    );

    // Check if 2FA is required
    if ('requires2FA' in result) {
      return reply.status(202).send({
        success: true,
        data: {
          requires2FA: true,
          tempToken: result.tempToken,
        },
      });
    }

    // Set refresh token as HTTP-only cookie
    reply.setCookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.server.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return reply.send({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  });

  // Complete 2FA login
  app.post('/2fa/complete', async (request, reply) => {
    const { tempToken, code } = request.body as any;

    const result = await complete2FALogin(
      tempToken,
      code,
      request.ip,
      request.headers['user-agent']
    );

    reply.setCookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.server.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return reply.send({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  });

  // Refresh token
  app.post('/refresh', { schema: refreshSchema }, async (request, reply) => {
    const { refreshToken } = request.body as any;

    // Also check cookie
    const cookieToken = request.cookies.refresh_token;
    const token = refreshToken || cookieToken;

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token provided',
        },
      });
    }

    const tokens = await refreshToken(token);

    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: config.server.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return reply.send({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    });
  });

  // ============================================================
  // LOGOUT
  // ============================================================

  // Logout
  app.post('/logout', { preHandler: authenticateRequest }, async (request, reply) => {
    await logout(request.session!.id);

    reply.clearCookie('refresh_token', { path: '/api/v1/auth' });

    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  // Logout all sessions
  app.post('/logout-all', { preHandler: authenticateRequest }, async (request, reply) => {
    await logoutAll(request.user!.id, request.session!.id);

    reply.clearCookie('refresh_token', { path: '/api/v1/auth' });

    return reply.send({
      success: true,
      data: { message: 'Logged out from all devices' },
    });
  });

  // ============================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================

  // Enable 2FA (step 1: generate secret)
  app.post('/2fa/enable', { preHandler: authenticateRequest }, async (request, reply) => {
    const result = await enable2FA(request.user!.id);

    return reply.send({
      success: true,
      data: {
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      },
    });
  });

  // Verify and enable 2FA (step 2: confirm)
  app.post(
    '/2fa/verify',
    { preHandler: authenticateRequest, schema: twoFASchema },
    async (request, reply) => {
      const { code } = request.body as any;

      await verifyAndEnable2FA(request.user!.id, code);

      return reply.send({
        success: true,
        data: { message: 'Two-factor authentication enabled' },
      });
    }
  );

  // Disable 2FA
  app.post(
    '/2fa/disable',
    { preHandler: authenticateRequest },
    async (request, reply) => {
      const { password } = request.body as any;

      await disable2FA(request.user!.id, password);

      return reply.send({
        success: true,
        data: { message: 'Two-factor authentication disabled' },
      });
    }
  );

  // ============================================================
  // PASSWORD MANAGEMENT
  // ============================================================

  // Change password
  app.post(
    '/change-password',
    { preHandler: authenticateRequest, schema: changePasswordSchema },
    async (request, reply) => {
      const { currentPassword, newPassword } = request.body as any;

      await changePassword(request.user!.id, currentPassword, newPassword);

      reply.clearCookie('refresh_token', { path: '/api/v1/auth' });

      return reply.send({
        success: true,
        data: {
          message: 'Password changed successfully. Please log in again.',
        },
      });
    }
  );

  // Request password reset
  app.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as any;

    // TODO: Implement password reset flow
    // For security, always return success even if email doesn't exist

    return reply.send({
      success: true,
      data: {
        message: 'If an account exists, a password reset email has been sent.',
      },
    });
  });

  // Reset password
  app.post('/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body as any;

    // TODO: Implement password reset confirmation

    return reply.send({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  });

  // ============================================================
  // SESSIONS
  // ============================================================

  // Get active sessions
  app.get('/sessions', { preHandler: authenticateRequest }, async (request, reply) => {
    const sessions = await prisma.userSessions.findMany({
      where: {
        userId: request.user!.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        os: true,
        browser: true,
        ipAddress: true,
        location: true,
        isTrusted: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          ...s,
          id: s.id,
          isCurrent: s.id === request.session!.id,
        })),
      },
    });
  });

  // Revoke specific session
  app.delete(
    '/sessions/:sessionId',
    { preHandler: authenticateRequest },
    async (request, reply) => {
      const { sessionId } = request.params as any;

      // Can only revoke own sessions
      const session = await prisma.userSessions.findFirst({
        where: {
          id: sessionId,
          userId: request.user!.id,
        },
      });

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        });
      }

      await prisma.userSessions.update({
        where: { id: sessionId },
        data: { revokedAt: new Date(), revokedReason: 'user_revoked' },
      });

      return reply.send({
        success: true,
        data: { message: 'Session revoked' },
      });
    }
  );

  // ============================================================
  // ME (Current User)
  // ============================================================

  // Get current user
  app.get('/me', { preHandler: authenticateRequest }, async (request, reply) => {
    const user = await prisma.users.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        snowflakeId: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        locale: true,
        timezone: true,
        emailVerified: true,
        twoFactorEnabled: true,
        status: true,
        customStatus: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        uploadQuotaBytes: true,
        uploadUsedBytes: true,
        createdAt: true,
      },
    });

    return reply.send({
      success: true,
      data: { user },
    });
  });
}

// Import prisma for session routes
import { prisma } from '@/config/database';
