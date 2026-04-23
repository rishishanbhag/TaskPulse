
import 'dotenv/config';

import Twilio from 'twilio';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

function toWhatsAppTo(e164: string) {
  const n = e164.trim();
  return n.toLowerCase().startsWith('whatsapp:') ? n : `whatsapp:${n}`;
}

async function main() {
  const accountSid = requireEnv('TWILIO_ACCOUNT_SID');
  const authToken = requireEnv('TWILIO_AUTH_TOKEN');
  const from = requireEnv('TWILIO_WHATSAPP_FROM');
  const toE164 = process.env.TWILIO_TEST_TO?.trim();
  if (!toE164) {
    console.error('Set TWILIO_TEST_TO to your E.164 number, e.g. TWILIO_TEST_TO=+9198xxxxxxx');
    process.exit(1);
  }

  const client = Twilio(accountSid, authToken);
  const msg = await client.messages.create({
    from,
    to: toWhatsAppTo(toE164),
    body: 'TaskPulse ping — Twilio credentials OK.',
  });

  console.log('Sent. sid=', msg.sid, 'status=', msg.status);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
