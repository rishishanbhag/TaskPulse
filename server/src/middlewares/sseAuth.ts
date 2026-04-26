import type { RequestHandler } from 'express';

import { UserModel } from '@/models/User.js';
import { cached } from '@/services/cache.js';
import { verifyJwt } from '@/utils/jwt.js';
import { isValidOrgIdString } from '@/utils/validateOrgId.js';
import type { Role } from '@/types/role.js';

export const requireAuthForSse: RequestHandler = async (req, res, next) => {
  try {
    const token =
      (typeof req.query.token === 'string' ? req.query.token : null) ??
      (() => {
        const auth = req.headers.authorization ?? '';
        const [, t] = auth.split(' ');
        return t || null;
      })();

    if (!token) return res.status(401).json({ error: { message: 'Missing token' } });

    const payload = verifyJwt(token);

    if (!isValidOrgIdString(payload.orgId)) {
      return res.status(401).json({ error: { message: 'Invalid or expired session. Please sign in again.' } });
    }

    const cacheKey = `tp:v1:user:${payload.sub}`;
    const user = await cached(cacheKey, 300, async () => {
      return UserModel.findById(payload.sub).select('_id orgId role name email phone').lean();
    });
    if (!user) return res.status(401).json({ error: { message: 'Invalid token' } });

    if (!isValidOrgIdString((user as any).orgId)) {
      return res
        .status(401)
        .json({ error: { message: 'Account has no organization. Sign out, then complete org sign-up or use an invite link.' } });
    }

    if (String((user as any).orgId) !== payload.orgId) {
      return res.status(401).json({ error: { message: 'Invalid token' } });
    }

    req.user = {
      id: String((user as any)._id),
      orgId: String((user as any).orgId),
      name: (user as any).name,
      email: (user as any).email,
      phone: (user as any).phone ?? null,
      role: (user as any).role as Role,
    };

    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid token' } });
  }
};
