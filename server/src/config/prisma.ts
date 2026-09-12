import { PrismaClient } from '@prisma/client';
import { config } from './env';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
