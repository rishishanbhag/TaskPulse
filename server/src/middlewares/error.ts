import type { ErrorRequestHandler } from 'express';

import { logger } from '@/config/logger.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');

  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message = typeof err?.message === 'string' ? err.message : 'Internal Server Error';
  const code = typeof (err as { code?: unknown })?.code === 'string' ? (err as { code: string }).code : undefined;

  res.status(statusCode).json({
    error: {
      message,
      ...(code ? { code } : {}),
    },
  });
};

