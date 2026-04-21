import type { RequestHandler } from 'express';

import { UserModel } from '@/models/User.js';
import { verifyJwt } from '@/utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'admin' | 'member' };
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const auth = req.headers.authorization ?? '';
    const [, token] = auth.split(' ');

    if (!token) return res.status(401).json({ error: { message: 'Missing bearer token' } });

    const payload = verifyJwt(token);

    const user = await UserModel.findById(payload.sub).select('_id role').lean();
    if (!user) return res.status(401).json({ error: { message: 'Invalid token' } });

    req.user = { id: String(user._id), role: user.role as 'admin' | 'member' };
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid token' } });
  }
};

