import Twilio from 'twilio';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

export const twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
export const twilioWhatsAppFrom = env.TWILIO_WHATSAPP_FROM;

export async function verifyTwilioConnected() {
  try {
    // This performs a real authenticated request, so we only log success when
    // the credentials/network are actually working.
    await twilioClient.api.accounts(env.TWILIO_ACCOUNT_SID).fetch();
    console.log('Twilio connected');
  } catch (err) {
    logger.error({ err }, 'Twilio connection check failed');
    throw err;
  }
}

