import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verifyToken, decodeToken } from '@/shared/utils/crypto';
import { prisma } from '@/config/database';
import { config } from '@/config/env';

// ============================================================
// AUTHENTICATION MIDDLEWARE
// JWT verification, session validation, permission checks
// ============================================================

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: bigint;
      snowflakeId: bigint;
      email: string;
      username: string;
      sessionId: string;
    };
    session?: {
      id: string;
      deviceName?: string;
      isTrusted: boolean;
    };
  }
}

// Authentication error
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string = 'UNAUTHORIZED',
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Authorization error
export class AuthorizationError extends Error {
  constructor(
    message: string = 'Forbidden',
    public code: string = 'FORBIDDEN',
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Extract token from request headers
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // Check cookie as fallback
  const cookieToken = request.cookies?.access_token;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

/**
 * Main authentication middleware
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided', 'NO_TOKEN');
    }

    // Verify token
    const payload = verifyToken(token);
    
    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type', 'INVALID_TOKEN_TYPE');
    }

    // Check if session is still valid
    const session = await prisma.userSessions.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new AuthenticationError('Session expired or revoked', 'SESSION_INVALID');
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        id: true,
        snowflakeId: true,
        email: true,
        username: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new AuthenticationError('User not found', 'USER_NOT_FOUND');
    }

    // Attach user and session to request
    request.user = {
      id: user.id,
      snowflakeId: user.snowflakeId,
      email: user.email,
      username: user.username,
      sessionId: payload.sessionId,
    };

    request.session = {
      id: session.id,
      deviceName: session.deviceName || undefined,
      isTrusted: session.isTrusted,
    };

    // Update last active
    await prisma.userSessions.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
    }
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token', 'INVALID_TOKEN');
    }
    
    throw new AuthenticationError('Authentication failed', 'AUTH_FAILED');
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await authenticateRequest(request, reply);
  } catch {
    // Silently fail for optional auth
    request.user = undefined;
    request.session = undefined;
  }
}

/**
 * Check if user has specific permission in a server
 */
export function requirePermission(permission: bigint) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }

    const serverId = request.params?.serverId || request.body?.serverId;
    
    if (!serverId) {
      throw new AuthorizationError('Server ID required for permission check');
    }

    // Check if user is server owner
    const server = await prisma.servers.findUnique({
      where: { id: BigInt(serverId) },
      select: { ownerId: true },
    });

    if (!server) {
      throw new AuthorizationError('Server not found');
    }

    if (server.ownerId === request.user.id) {
      return; // Owner has all permissions
    }

    // Get user's roles and permissions
    const member = await prisma.serverMembers.findFirst({
      where: {
        serverId: BigInt(serverId),
        userId: request.user.id,
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
      throw new AuthorizationError('Not a member of this server');
    }

    // Calculate effective permissions
    const permissions = member.roleMembers.reduce((acc, rm) => {
      return acc | BigInt(rm.role.permissions);
    }, 0n);

    // Check for administrator permission
    if ((permissions & (1n << 3n)) === (1n << 3n)) {
      return; // Administrator has all permissions
    }

    // Check specific permission
    if ((permissions & permission) !== permission) {
      throw new AuthorizationError('You do not have permission to perform this action');
    }
  };
}

/**
 * Check if user is server owner
 */
export async function requireServerOwner(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    throw new AuthenticationError('Authentication required');
  }

  const serverId = request.params?.serverId || request.body?.serverId;
  
  if (!serverId) {
    throw new AuthorizationError('Server ID required');
  }

  const server = await prisma.servers.findUnique({
    where: { id: BigInt(serverId) },
    select: { ownerId: true },
  });

  if (!server) {
    throw new AuthorizationError('Server not found');
  }

  if (server.ownerId !== request.user.id) {
    throw new AuthorizationError('Only server owner can perform this action');
  }
}

/**
 * Check if user is server administrator
 */
export async function requireServerAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    throw new AuthenticationError('Authentication required');
  }

  const serverId = request.params?.serverId || request.body?.serverId;
  
  if (!serverId) {
    throw new AuthorizationError('Server ID required');
  }

  const server = await prisma.servers.findUnique({
    where: { id: BigInt(serverId) },
    select: { ownerId: true },
  });

  if (!server) {
    throw new AuthorizationError('Server not found');
  }

  if (server.ownerId === request.user.id) {
    return; // Owner is admin
  }

  const member = await prisma.serverMembers.findFirst({
    where: {
      serverId: BigInt(serverId),
      userId: request.user.id,
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
    throw new AuthorizationError('Not a member of this server');
  }

  const permissions = member.roleMembers.reduce((acc, rm) => {
    return acc | BigInt(rm.role.permissions);
  }, 0n);

  // Check for administrator permission (bit 3)
  if ((permissions & (1n << 3n)) !== (1n << 3n)) {
    throw new AuthorizationError('Administrator permission required');
  }
}

/**
 * Rate limit by user ID
 */
export function createUserRateLimit(
  windowMs: number,
  maxRequests: number
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.user?.id.toString() || request.ip;
    const now = Date.now();
    
    const record = requests.get(userId);
    
    if (!record || now > record.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }
    
    if (record.count >= maxRequests) {
      reply.header('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      throw new AuthorizationError('Rate limit exceeded', 'RATE_LIMITED', 429);
    }
    
    record.count++;
  };
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    done();
    return;
  }

  const csrfToken = request.headers['x-csrf-token'];
  const cookieToken = request.cookies?.csrf_token;

  if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
    reply.status(403).send({
      success: false,
      error: {
        code: 'CSRF_INVALID',
        message: 'Invalid CSRF token',
      },
    });
    return;
  }

  done();
}
