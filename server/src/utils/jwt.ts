import jwt from 'jsonwebtoken';

import { env } from '@/config/env.js';

export type JwtPayload = {
  sub: string;
  role: 'admin' | 'member';
};

export function signJwt(payload: JwtPayload) {
  return (jwt as any).sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }) as string;
}

export function verifyJwt(token: string) {
  return (jwt as any).verify(token, env.JWT_SECRET) as JwtPayload;
}

