import { Redis } from 'ioredis';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

const log = logger.child({ component: 'redis' });

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('ready', () => {
  log.info('Redis ready');
});

redis.on('error', (err) => {
  log.error({ err }, 'Redis error');
});

export function bullConnection() {
  return { connection: redis };
}

