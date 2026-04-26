import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  descriptionHtml: z.string().min(1).max(20_000),
  defaultPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  defaultAssignedTo: z.array(objectId).min(1),
  defaultDeadlineOffsetMinutes: z.number().int().positive().max(365 * 24 * 60).optional(),
});

export const instantiateTemplateSchema = z.object({});

