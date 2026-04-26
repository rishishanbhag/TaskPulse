import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { orgController } from '@/controllers/orgController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { devOnly } from '@/middlewares/devOnly.js';
import { requireRole } from '@/middlewares/rbac.js';
import { UserRole } from '@/models/User.js';
import { validate } from '@/middlewares/validate.js';
import {
  devOrgJoinSchema,
  devOrgSignupSchema,
  orgInviteCreateSchema,
  orgJoinSchema,
  orgMemberRoleSchema,
  orgSignupSchema,
} from '@/schemas/org.schema.js';

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const orgRoutes = Router();

orgRoutes.post('/signup', limiter, validate(orgSignupSchema), orgController.signup);
orgRoutes.post('/join', limiter, validate(orgJoinSchema), orgController.join);
orgRoutes.post('/dev-signup', limiter, devOnly, validate(devOrgSignupSchema), orgController.devSignup);
orgRoutes.post('/dev-join', limiter, devOnly, validate(devOrgJoinSchema), orgController.devJoin);

orgRoutes.get('/me', requireAuth, orgController.me);
orgRoutes.get(
  '/me/members',
  requireAuth,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  orgController.listMembers,
);
orgRoutes.patch(
  '/me/members/:userId/role',
  requireAuth,
  requireRole(UserRole.OWNER),
  validate(orgMemberRoleSchema),
  orgController.patchMemberRole,
);
orgRoutes.delete(
  '/me/members/:userId',
  requireAuth,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  orgController.removeMember,
);
orgRoutes.post(
  '/me/invites',
  requireAuth,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  validate(orgInviteCreateSchema),
  orgController.createInvite,
);
orgRoutes.get(
  '/me/invites',
  requireAuth,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  orgController.listInvites,
);
