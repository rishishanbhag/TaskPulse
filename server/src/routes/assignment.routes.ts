import { Router } from 'express';

import { assignmentController } from '@/controllers/assignmentController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { validate } from '@/middlewares/validate.js';
import { assignmentDelayBodySchema, assignmentHelpBodySchema } from '@/schemas/assignment.schema.js';
import { z } from 'zod';

const empty = z.object({});

export const assignmentRoutes = Router();
assignmentRoutes.use(requireAuth);

assignmentRoutes.post('/:id/done', validate(empty), assignmentController.done);
assignmentRoutes.post('/:id/help', validate(assignmentHelpBodySchema), assignmentController.help);
assignmentRoutes.post('/:id/delay', validate(assignmentDelayBodySchema), assignmentController.delay);
