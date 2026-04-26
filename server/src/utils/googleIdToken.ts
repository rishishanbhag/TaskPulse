import { OAuth2Client } from 'google-auth-library';

import { env } from '@/config/env.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export type GoogleIdPayload = { sub: string; email: string; name: string };

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.name) {
    const err = new Error('Invalid Google token payload');
    (err as any).statusCode = 401;
    throw err;
  }
  return { sub: payload.sub, email: payload.email.trim().toLowerCase(), name: payload.name };
}
