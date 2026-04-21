import Twilio from 'twilio';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

export const twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
export const twilioWhatsAppFrom = env.TWILIO_WHATSAPP_FROM;

const sid = env.TWILIO_ACCOUNT_SID;
logger.info(
  {
    component: 'twilio',
    accountSidPrefix: sid.length >= 6 ? sid.slice(0, 6) : sid,
    from: twilioWhatsAppFrom,
  },
  'Twilio client initialized',
);

