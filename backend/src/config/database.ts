/**
 * Database Configuration
 * 
 * This file contains database connection settings and Prisma client setup.
 * We use PostgreSQL as our primary database with Prisma as the ORM.
 * 
 * Database Schema Overview:
 * - Users: Store user accounts and authentication data
 * - GeneratedApis: Store metadata about generated APIs
 * - ApiExecutions: Log API calls and performance metrics
 * - ApiSchemas: Store API input/output schemas
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';

// Prisma client singleton
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Initialize Prisma client
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

// Database connection test
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful disconnect
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Database disconnected');
  } catch (error) {
    logger.error('❌ Database disconnect failed:', error);
  }
};

// Database configuration object
export const config = {
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: 10,
    connectionTimeout: 30000,
  },
  redis: {
    // Future: Add Redis configuration for caching
    url: process.env.REDIS_URL,
    ttl: 3600, // 1 hour default TTL
  }
};

export { prisma };
export default prisma;
