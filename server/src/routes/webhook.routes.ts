import { Router } from 'express';
import express from 'express';

import { webhookController } from '@/controllers/webhookController.js';
import { verifyTwilioSignature } from '@/middlewares/twilioSignature.js';

export const webhookRoutes = Router();

// Twilio sends x-www-form-urlencoded by default for webhooks.
webhookRoutes.post(
  '/twilio-status',
  express.urlencoded({ extended: false }),
  verifyTwilioSignature,
  webhookController.twilioStatus,
);

webhookRoutes.post(
  '/twilio-incoming',
  express.urlencoded({ extended: false }),
  verifyTwilioSignature,
  webhookController.twilioIncoming,
);

