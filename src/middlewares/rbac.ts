import type { RequestHandler } from 'express';

export function requireRole(role: 'admin' | 'member'): RequestHandler {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    if (req.user.role !== role) return res.status(403).json({ error: { message: 'Forbidden' } });
    next();
  };
}

