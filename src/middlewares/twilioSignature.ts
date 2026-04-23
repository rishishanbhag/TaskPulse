import type { RequestHandler } from 'express';
import Twilio from 'twilio';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

export const verifyTwilioSignature: RequestHandler = (req, res, next) => {
  if (env.NODE_ENV !== 'production' && env.TWILIO_SKIP_SIGNATURE) {
    logger.warn(
      { path: req.originalUrl },
      'Twilio signature verification skipped (TWILIO_SKIP_SIGNATURE=true)',
    );
    return next();
  }

  const signature = req.header('X-Twilio-Signature');
  if (!signature) return res.status(401).json({ error: { message: 'Missing Twilio signature' } });

  const url = `${env.PUBLIC_URL}${req.originalUrl}`;

  const valid = Twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body ?? {});
  if (!valid) return res.status(401).json({ error: { message: 'Invalid Twilio signature' } });

  next();
};

