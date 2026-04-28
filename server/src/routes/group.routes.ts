import { Router } from 'express';

import { groupController } from '@/controllers/groupController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { requireManagerGroupParamIfManager, requireRole } from '@/middlewares/rbac.js';
import { validate } from '@/middlewares/validate.js';
import { UserRole } from '@/models/User.js';
import { createGroupSchema, groupMemberBodySchema, updateGroupSchema } from '@/schemas/group.schema.js';

export const groupRoutes = Router();
groupRoutes.use(requireAuth);

groupRoutes.get('/', groupController.list);
groupRoutes.post(
  '/',
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  validate(createGroupSchema),
  groupController.create,
);
groupRoutes.patch(
  '/:id',
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  validate(updateGroupSchema),
  groupController.update,
);
groupRoutes.delete('/:id', requireRole(UserRole.OWNER, UserRole.ADMIN), groupController.remove);
groupRoutes.post(
  '/:id/members',
  requireRole(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER),
  requireManagerGroupParamIfManager('id'),
  validate(groupMemberBodySchema),
  groupController.addMember,
);
groupRoutes.delete(
  '/:id/members/:userId',
  requireRole(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER),
  requireManagerGroupParamIfManager('id'),
  groupController.removeMember,
);
