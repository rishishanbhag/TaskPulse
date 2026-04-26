import { Router } from 'express';

import { userController } from '@/controllers/userController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { requireRole } from '@/middlewares/rbac.js';
import { UserRole } from '@/models/User.js';

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get('/', requireRole(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER), userController.list);
