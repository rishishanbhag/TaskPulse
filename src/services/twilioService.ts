import { env } from '@/config/env.js';
import { twilioClient, twilioWhatsAppFrom } from '@/config/twilio.js';
import { toTwilioWhatsAppTo } from '@/utils/phone.js';

export async function sendWhatsAppTaskMessage(input: { toE164: string; body: string; taskId: string }) {
  const statusCallback = `${env.PUBLIC_URL}/webhooks/twilio-status`;

  const msg = await twilioClient.messages.create({
    from: twilioWhatsAppFrom,
    to: toTwilioWhatsAppTo(input.toE164),
    body: input.body,
    statusCallback,
  });

  return { sid: msg.sid, status: msg.status ?? 'queued' };
}

