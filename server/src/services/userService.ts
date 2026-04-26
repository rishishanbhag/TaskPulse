import mongoose from 'mongoose';

import { GroupModel } from '@/models/Group.js';
import { UserModel, type UserDoc } from '@/models/User.js';
import { cached, delKeys } from '@/services/cache.js';

export async function listUsers(input: { orgId: string; role?: string; q?: string; groupId?: string }) {
  const query: Record<string, unknown> = { orgId: new mongoose.Types.ObjectId(input.orgId) };

  if (input.role === 'admin' || input.role === 'member' || input.role === 'manager' || input.role === 'owner') {
    query.role = input.role;
  }

  if (input.groupId) {
    const g = await GroupModel.findOne({ _id: input.groupId, orgId: input.orgId }).lean();
    if (!g) {
      return [];
    }
    const ids = ((g as any).members as unknown as mongoose.Types.ObjectId[]).map((x) => x);
    query._id = { $in: ids };
  }

  if (input.q && input.q.trim()) {
    const q = input.q.trim();
    query.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  }

  const cacheKey = `tp:v1:org:${input.orgId}:users:members`;
  // Do not use the org-wide key when a group (or search/role) narrows the query — avoid wrong cached rows.
  const isSimpleList = !input.q?.trim() && !input.role && !input.groupId;

  if (isSimpleList) {
    return cached(cacheKey, 300, async () => listUsersQuery(query));
  }
  return listUsersQuery(query);
}

async function listUsersQuery(query: Record<string, unknown>) {
  const users = await UserModel.find(query).sort({ name: 1 }).lean();
  return users.map((u) => ({
    id: String((u as any)._id),
    name: (u as any).name,
    email: (u as any).email,
    phone: (u as any).phone ?? null,
    role: (u as any).role,
  }));
}

export async function updateUserPhone(orgId: string, userId: string, phone: string) {
  const updated = await UserModel.findOneAndUpdate(
    { _id: userId, orgId: new mongoose.Types.ObjectId(orgId) },
    { $set: { phone } },
    { new: true },
  );
  if (updated) {
    await delKeys([`tp:v1:user:${userId}`, `tp:v1:org:${orgId}:users:members`]);
  }
  return updated;
}

/**
 * @deprecated use org sign-up flows. Retained for tests that import UserDoc.
 */
export async function upsertDevUser(_input: {
  email: string;
  name: string;
  role: 'admin' | 'member';
  phone?: string;
}): Promise<UserDoc> {
  throw new Error('upsertDevUser is removed — use org dev-signup / dev-join');
}

export async function upsertGoogleUser(_input: { googleId: string; email: string; name: string }): Promise<UserDoc> {
  throw new Error('upsertGoogleUser is removed — use org sign-up or Google login only');
}
