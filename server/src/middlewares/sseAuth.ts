import type { RequestHandler } from 'express';

import { UserModel } from '@/models/User.js';
import { cached } from '@/services/cache.js';
import { verifyJwt } from '@/utils/jwt.js';

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
    const cacheKey = `tp:v1:user:${payload.sub}`;
    const user = await cached(cacheKey, 300, async () => {
      return UserModel.findById(payload.sub).select('_id role name email phone').lean();
    });
    if (!user) return res.status(401).json({ error: { message: 'Invalid token' } });

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role as 'admin' | 'member',
    };

    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid token' } });
  }
};

