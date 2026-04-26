import { z } from 'zod';

export const assignmentHelpBodySchema = z.object({
  note: z.string().max(500).optional(),
});

export const assignmentDelayBodySchema = z.object({
  until: z.coerce.date().optional(),
});
