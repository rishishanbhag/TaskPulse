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
            role: 'member',
            name: 'Member',
            email: 'member@test.local',
            phone: '+14155552671',
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
      role: 'member',
    })),
  };
});

import { requireAuthForSse } from './sseAuth.js';

describe('requireAuthForSse', () => {
  it('accepts token via query string', async () => {
    const req: any = { query: { token: 'abc' }, headers: {}, on: vi.fn() };
    const res: any = { status: vi.fn(() => res), json: vi.fn() };
    const next = vi.fn();

    await requireAuthForSse(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.role).toBe('member');
  });
});

