import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),

  // Database
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // File Storage (S3)
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().default('commune-uploads'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_CDN_URL: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM: z.string().optional(),
  STRIPE_PRICE_PREMIUM_PLUS: z.string().optional(),

  // Web Push
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Security
  BCRYPT_ROUNDS: z.string().default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Voice (LiveKit/Mediasoup)
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  LIVEKIT_WS_URL: z.string().optional(),

  // Features
  ENABLE_VOICE: z.string().default('true'),
  ENABLE_SCREENSHARE: z.string().default('true'),
  ENABLE_FILE_UPLOADS: z.string().default('true'),
  MAX_UPLOAD_SIZE_MB: z.string().default('100'),
  ENABLE_ANALYTICS: z.string().default('true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Typed config object
export const config = {
  server: {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    host: env.HOST,
    apiPrefix: env.API_PREFIX,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },
  database: {
    url: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpiration: env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: env.JWT_REFRESH_EXPIRATION,
  },
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
    },
  },
  s3: {
    endpoint: env.S3_ENDPOINT,
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    cdnUrl: env.S3_CDN_URL,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    prices: {
      premium: env.STRIPE_PRICE_PREMIUM,
      premiumPlus: env.STRIPE_PRICE_PREMIUM_PLUS,
    },
  },
  webPush: {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  },
  security: {
    bcryptRounds: parseInt(env.BCRYPT_ROUNDS, 10),
    rateLimitWindowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    rateLimitMaxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
    corsOrigin: env.CORS_ORIGIN,
  },
  voice: {
    enabled: env.ENABLE_VOICE === 'true',
    screenshareEnabled: env.ENABLE_SCREENSHARE === 'true',
    livekit: {
      apiKey: env.LIVEKIT_API_KEY,
      apiSecret: env.LIVEKIT_API_SECRET,
      wsUrl: env.LIVEKIT_WS_URL,
    },
  },
  uploads: {
    enabled: env.ENABLE_FILE_UPLOADS === 'true',
    maxSizeMB: parseInt(env.MAX_UPLOAD_SIZE_MB, 10),
  },
  analytics: {
    enabled: env.ENABLE_ANALYTICS === 'true',
  },
} as const;
