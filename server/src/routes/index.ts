import { Router } from 'express';

import { authRoutes } from '@/routes/auth.routes.js';
import { taskRoutes } from '@/routes/task.routes.js';
import { webhookRoutes } from '@/routes/webhook.routes.js';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/webhooks', webhookRoutes);

