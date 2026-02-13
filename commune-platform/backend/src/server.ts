import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis, redis } from './config/redis';
import { setupWebSocketGateway } from './websocket/gateway';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerUserRoutes } from './modules/user/user.routes';
import { registerServerRoutes } from './modules/server/server.routes';
import { registerChannelRoutes } from './modules/channel/channel.routes';
import { registerMessageRoutes } from './modules/message/message.routes';
import { registerVoiceRoutes } from './modules/voice/voice.routes';
import { registerNotificationRoutes } from './modules/notification/notification.routes';
import { registerMediaRoutes } from './modules/media/media.routes';
import { registerSubscriptionRoutes } from './modules/subscription/subscription.routes';
import { registerAnalyticsRoutes } from './modules/analytics/analytics.routes';

// ============================================================
// MAIN SERVER
// Fastify application with all modules
// ============================================================

// Create Fastify instance
const app = Fastify({
  logger: {
    level: config.server.isDev ? 'debug' : 'info',
    transport: config.server.isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  trustProxy: true,
  connectionTimeout: 30000,
  keepAliveTimeout: 60000,
});

// ============================================================
// PLUGINS & MIDDLEWARE
// ============================================================

async function registerPlugins(): Promise<void> {
  // CORS
  await app.register(cors, {
    origin: config.security.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: config.server.isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:'],
          },
        }
      : false,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: config.security.rateLimitMaxRequests,
    timeWindow: config.security.rateLimitWindowMs,
    redis: redis,
    keyGenerator: (request) => {
      return request.user?.id.toString() || request.ip;
    },
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          context.after / 1000
        )} seconds.`,
      },
    }),
  });

  // Compression
  await app.register(compress, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });

  // Cookies
  await app.register(cookie, {
    secret: config.jwt.secret,
    parseOptions: {
      httpOnly: true,
      secure: config.server.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });

  // WebSocket
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3,
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024,
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
      },
    },
  });
}

// ============================================================
// ROUTES
// ============================================================

async function registerRoutes(): Promise<void> {
  const apiPrefix = config.server.apiPrefix;

  // Health check
  app.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.server.env,
    };
  });

  // API routes
  await app.register(registerAuthRoutes, { prefix: `${apiPrefix}/auth` });
  await app.register(registerUserRoutes, { prefix: `${apiPrefix}/users` });
  await app.register(registerServerRoutes, { prefix: `${apiPrefix}/servers` });
  await app.register(registerChannelRoutes, { prefix: `${apiPrefix}/channels` });
  await app.register(registerMessageRoutes, { prefix: `${apiPrefix}/messages` });
  await app.register(registerVoiceRoutes, { prefix: `${apiPrefix}/voice` });
  await app.register(registerNotificationRoutes, { prefix: `${apiPrefix}/notifications` });
  await app.register(registerMediaRoutes, { prefix: `${apiPrefix}/media` });
  await app.register(registerSubscriptionRoutes, { prefix: `${apiPrefix}/subscriptions` });
  await app.register(registerAnalyticsRoutes, { prefix: `${apiPrefix}/analytics` });

  // WebSocket gateway
  setupWebSocketGateway(app);
}

// ============================================================
// ERROR HANDLING
// ============================================================

function setupErrorHandling(): void {
  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Handle specific error types
    if (error.name === 'AuthenticationError') {
      return reply.status(401).send({
        success: false,
        error: {
          code: error.message || 'UNAUTHORIZED',
          message: error.message,
        },
      });
    }

    if (error.name === 'AuthorizationError') {
      return reply.status(403).send({
        success: false,
        error: {
          code: error.message || 'FORBIDDEN',
          message: error.message,
        },
      });
    }

    if (error.name === 'ValidationError') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    // Rate limit error
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      });
    }

    // Generic error response
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: config.server.isDev
          ? error.message
          : 'An internal error occurred',
        ...(config.server.isDev && { stack: error.stack }),
      },
    });
  });
}

// ============================================================
// SERVER STARTUP
// ============================================================

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();
    setupErrorHandling();

    // Start server
    const { port, host } = config.server;
    await app.listen({ port, host });

    app.log.info(`🚀 Server running at http://${host}:${port}`);
    app.log.info(`📡 API prefix: ${config.server.apiPrefix}`);
    app.log.info(`🔧 Environment: ${config.server.env}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      app.log.info(`📴 Received ${signal}. Starting graceful shutdown...`);

      // Close server (stop accepting new connections)
      await app.close();

      // Disconnect from databases
      await disconnectRedis();
      await disconnectDatabase();

      app.log.info('✅ Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      app.log.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      app.log.error('Unhandled Rejection:', reason);
    });

  } catch (error) {
    app.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
