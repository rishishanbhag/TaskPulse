import { OAuth2Client } from 'google-auth-library';

import { env } from '@/config/env.js';
import { upsertDevUser, upsertGoogleUser } from '@/services/userService.js';
import { signJwt } from '@/utils/jwt.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function loginWithGoogleIdToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.name) {
    const err = new Error('Invalid Google token payload');
    (err as any).statusCode = 401;
    throw err;
  }

  const user = await upsertGoogleUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
  });

  const token = signJwt({ sub: String((user as any)._id), role: (user as any).role });

  return {
    token,
    user: {
      id: String((user as any)._id),
      name: (user as any).name,
      email: (user as any).email,
      phone: (user as any).phone ?? null,
      role: (user as any).role,
    },
  };
}

export async function loginWithDevCredentials(input: {
  email: string;
  name?: string;
  role?: 'admin' | 'member';
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || email.split('@')[0] || 'Dev User';
  const role = input.role ?? 'member';
  const user = await upsertDevUser({
    email,
    name,
    role,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
  });

  const token = signJwt({ sub: String((user as any)._id), role: (user as any).role });

  return {
    token,
    user: {
      id: String((user as any)._id),
      name: (user as any).name,
      email: (user as any).email,
      phone: (user as any).phone ?? null,
      role: (user as any).role,
    },
  };
}

