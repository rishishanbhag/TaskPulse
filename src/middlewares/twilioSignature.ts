import type { RequestHandler } from 'express';
import Twilio from 'twilio';

import { env } from '@/config/env.js';

export const verifyTwilioSignature: RequestHandler = (req, res, next) => {
  const signature = req.header('X-Twilio-Signature');
  if (!signature) return res.status(401).json({ error: { message: 'Missing Twilio signature' } });

  const url = `${env.PUBLIC_URL}${req.originalUrl}`;

  const valid = Twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body ?? {});
  if (!valid) return res.status(401).json({ error: { message: 'Invalid Twilio signature' } });

  next();
};

