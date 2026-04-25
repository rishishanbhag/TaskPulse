import { z } from 'zod';

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

const e164 = z
  .string()
  .trim()
  .regex(/^\+\d{7,15}$/, 'Phone must be E.164 format, e.g. +14155552671');

export const updatePhoneSchema = z.object({
  phone: e164,
});

export const devLoginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(['admin', 'member']).optional(),
  phone: e164.optional(),
});

