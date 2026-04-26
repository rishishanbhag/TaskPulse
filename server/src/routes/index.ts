import { Router } from 'express';

import { assignmentRoutes } from '@/routes/assignment.routes.js';
import { authRoutes } from '@/routes/auth.routes.js';
import { groupRoutes } from '@/routes/group.routes.js';
import { orgRoutes } from '@/routes/org.routes.js';
import { streamRoutes } from '@/routes/stream.routes.js';
import { taskRoutes } from '@/routes/task.routes.js';
import { templateRoutes } from '@/routes/template.routes.js';
import { userRoutes } from '@/routes/user.routes.js';
import { webhookRoutes } from '@/routes/webhook.routes.js';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/orgs', orgRoutes);
router.use('/groups', groupRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/stream', streamRoutes);
router.use('/tasks', taskRoutes);
router.use('/templates', templateRoutes);
router.use('/users', userRoutes);
router.use('/webhooks', webhookRoutes);

