import { Router } from 'express';

import { taskController } from '@/controllers/taskController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { requireRole } from '@/middlewares/rbac.js';
import { validate } from '@/middlewares/validate.js';
import { approveTaskSchema, createTaskSchema, rescheduleTaskSchema } from '@/schemas/task.schema.js';
import { UserRole } from '@/models/User.js';

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get('/', taskController.list);
taskRoutes.get('/:id', taskController.getById);

const manage = [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER] as const;

taskRoutes.post('/', requireRole(...manage), validate(createTaskSchema), taskController.create);
taskRoutes.post('/:id/approve', requireRole(...manage), validate(approveTaskSchema), taskController.approve);
taskRoutes.post('/:id/reschedule', requireRole(...manage), validate(rescheduleTaskSchema), taskController.reschedule);

