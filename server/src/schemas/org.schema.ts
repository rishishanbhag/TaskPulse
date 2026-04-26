import { z } from 'zod';

export const orgSignupSchema = z.object({
  idToken: z.string().min(1),
  orgName: z.string().min(1).max(200).trim(),
});

export const orgJoinSchema = z.object({
  idToken: z.string().min(1),
  code: z.string().min(1).max(20).trim(),
});

const e164 = z
  .string()
  .trim()
  .regex(/^\+\d{7,15}$/, 'Phone must be E.164 format, e.g. +14155552671');

export const devOrgSignupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().min(1).max(200).optional(),
  orgName: z.string().min(1).max(200).trim(),
  phone: e164.optional(),
});

export const devOrgJoinSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(20).trim(),
  phone: e164.optional(),
});

export const orgInviteCreateSchema = z.object({
  defaultRole: z.enum(['admin', 'manager', 'member']),
  expiresInHours: z.number().int().positive().max(24 * 365).optional(),
});

export const orgMemberRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'member']),
});
