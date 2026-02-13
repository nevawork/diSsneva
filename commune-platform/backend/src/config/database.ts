import { PrismaClient } from '@prisma/client';
import { config } from './env';

// ============================================================
// DATABASE CONFIGURATION
// Prisma client with connection pooling and logging
// ============================================================

// Prisma client singleton
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.server.isDev
    ? ['query', 'info', 'warn', 'error']
    : ['error', 'warn'],
});

// Connection management
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📴 Database disconnected');
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
