import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  assignedTo: z.array(objectId).min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.coerce.date().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const approveTaskSchema = z.object({});

export const rescheduleTaskSchema = z.object({
  scheduledAt: z.coerce.date(),
});

