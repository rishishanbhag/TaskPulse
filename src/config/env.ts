import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUBLIC_URL: z.string().url(),

  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),

  GOOGLE_CLIENT_ID: z.string().min(1),

  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_FROM: z.string().min(1),

  /** Dev only: skip X-Twilio-Signature validation when true (e.g. ngrok URL mismatch). */
  TWILIO_SKIP_SIGNATURE: z
    .preprocess((val) => {
      if (val === undefined || val === '') return false;
      if (val === true || val === 'true' || val === '1') return true;
      return false;
    }, z.boolean())
    .default(false),
});

export const env = envSchema.parse(process.env);

