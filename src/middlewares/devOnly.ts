import type { RequestHandler } from 'express';

import { env } from '@/config/env.js';

/** Blocks route in production (returns 404). Use before dev-only handlers. */
export const devOnly: RequestHandler = (_req, res, next) => {
  if (env.NODE_ENV === 'production') {
    return res.status(404).json({ error: { message: 'Not found' } });
  }
  next();
};
