import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createGroupSchema = z.object({
  name: z.string().min(1).max(200).trim(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).trim(),
});

export const groupMemberBodySchema = z.object({
  userId: objectId,
});
