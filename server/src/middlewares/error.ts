import type { ErrorRequestHandler } from 'express';

import { logger } from '@/config/logger.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');

  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const isServerError = statusCode >= 500;
  const message =
    isServerError ? 'Internal Server Error' : typeof err?.message === 'string' ? err.message : 'Request failed';
  const code = typeof (err as { code?: unknown })?.code === 'string' ? (err as { code: string }).code : undefined;

  res.status(statusCode).json({
    error: {
      message,
      ...(!isServerError && code ? { code } : {}),
    },
  });
};

