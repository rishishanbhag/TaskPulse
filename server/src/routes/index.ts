import { Router } from 'express';

import { authRoutes } from '@/routes/auth.routes.js';
import { streamRoutes } from '@/routes/stream.routes.js';
import { taskRoutes } from '@/routes/task.routes.js';
import { userRoutes } from '@/routes/user.routes.js';
import { webhookRoutes } from '@/routes/webhook.routes.js';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/stream', streamRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/webhooks', webhookRoutes);

