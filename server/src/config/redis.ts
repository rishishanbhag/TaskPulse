import { Redis } from 'ioredis';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('ready', () => {
  console.log('Redis started');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

export function bullConnection() {
  return { connection: redis };
}

