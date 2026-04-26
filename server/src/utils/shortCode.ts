import { customAlphabet } from 'nanoid';

import mongoose from 'mongoose';

import { TaskModel } from '@/models/Task.js';

const suffix = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

export function formatTaskCode(suffix5: string) {
  return `T-${suffix5}`;
}

export function randomTaskCode() {
  return formatTaskCode(suffix());
}

/**
 * Create a new unique (per-organization) task short code, e.g. T-K8Q3M
 */
export async function generateUniqueTaskShortCode(orgId: string, attempts = 8): Promise<string> {
  const oid = new mongoose.Types.ObjectId(orgId);
  for (let i = 0; i < attempts; i++) {
    const code = randomTaskCode();
    const exists = await TaskModel.exists({ orgId: oid, shortCode: code });
    if (!exists) return code;
  }
  const err = new Error('Could not allocate task code');
  (err as any).statusCode = 500;
  throw err;
}
