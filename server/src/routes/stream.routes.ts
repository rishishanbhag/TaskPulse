import { Router } from 'express';

import { streamController } from '@/controllers/streamController.js';
import { requireAuthForSse } from '@/middlewares/sseAuth.js';

export const streamRoutes = Router();

streamRoutes.get('/tasks', requireAuthForSse, streamController.tasks);

