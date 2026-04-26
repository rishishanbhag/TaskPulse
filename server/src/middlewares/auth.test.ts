import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/cache.js', () => {
  return {
    cached: async (_key: string, _ttl: number, loader: () => Promise<any>) => loader(),
  };
});

vi.mock('../models/User.js', () => {
  return {
    UserModel: {
      findById: vi.fn(() => ({
        select: vi.fn(() => ({
          lean: vi.fn(async () => ({
            _id: '507f1f77bcf86cd799439011',
            orgId: '507f1f77bcf86cd799439021',
            role: 'admin',
            name: 'Admin',
            email: 'admin@test.local',
            phone: null,
          })),
        })),
      })),
    },
  };
});

vi.mock('../utils/jwt.js', () => {
  return {
    verifyJwt: vi.fn(() => ({
      sub: '507f1f77bcf86cd799439011',
      orgId: '507f1f77bcf86cd799439021',
      role: 'admin',
    })),
  };
});

import { requireAuth } from './auth.js';

describe('requireAuth', () => {
  it('sets req.user and calls next for valid token', async () => {
    const req: any = { headers: { authorization: 'Bearer token' } };
    const res: any = { status: vi.fn(() => res), json: vi.fn() };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      id: '507f1f77bcf86cd799439011',
      orgId: '507f1f77bcf86cd799439021',
      name: 'Admin',
      email: 'admin@test.local',
      phone: null,
      role: 'admin',
    });
  });

  it('returns 401 when missing token', async () => {
    const req: any = { headers: {} };
    const res: any = { status: vi.fn(() => res), json: vi.fn() };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

