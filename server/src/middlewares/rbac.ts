import type { RequestHandler } from 'express';

import { GroupModel } from '@/models/Group.js';
import { UserRole } from '@/models/User.js';
import type { Role } from '@/types/role.js';

export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: { message: 'Forbidden' } });
    next();
  };
}

/**
 * For `/:id/members` routes. Owners/admins may manage any group; managers only groups they belong to.
 */
export function requireManagerGroupParamIfManager(param = 'id'): RequestHandler {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { orgId, role, id: userId } = req.user;
    if (role === UserRole.OWNER || role === UserRole.ADMIN) return next();
    if (role !== UserRole.MANAGER) return res.status(403).json({ error: { message: 'Forbidden' } });

    const groupId = req.params[param];
    if (!groupId) return res.status(400).json({ error: { message: 'Missing group id' } });

    const g = await GroupModel.findOne({
      _id: groupId,
      orgId,
      members: userId,
    })
      .select('_id')
      .lean();
    if (!g) return res.status(403).json({ error: { message: 'Not a member of this group' } });
    next();
  };
}
