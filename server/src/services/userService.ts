import { UserModel, type UserDoc } from '@/models/User.js';
import { cached, delKeys } from '@/services/cache.js';

export async function getUserByGoogleId(googleId: string) {
  return UserModel.findOne({ googleId });
}

async function listUsersQuery(input: { role?: string; q?: string }) {
  const query: Record<string, unknown> = {};

  if (input.role === 'admin' || input.role === 'member') {
    query.role = input.role;
  }

  if (input.q && input.q.trim()) {
    const q = input.q.trim();
    query.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  }

  const users = await UserModel.find(query).sort({ createdAt: -1 }).lean();
  return users.map((u) => ({
    id: String((u as any)._id),
    name: (u as any).name,
    email: (u as any).email,
    phone: (u as any).phone ?? null,
    role: (u as any).role as 'admin' | 'member',
  }));
}

export async function listUsers(input: { role?: string; q?: string }) {
  const isMembersList = input.role === 'member' && (!input.q || !input.q.trim());
  if (isMembersList) {
    return cached('tp:v1:users:members', 300, async () => listUsersQuery({ role: 'member', q: undefined }));
  }
  return listUsersQuery(input);
}

/** Dev/testing only: stable googleId per email so OAuth and dev-login do not collide. */
export async function upsertDevUser(input: {
  email: string;
  name: string;
  role: 'admin' | 'member';
  phone?: string;
}): Promise<UserDoc> {
  const email = input.email.trim().toLowerCase();
  const googleId = `dev:${email}`;
  const user = await UserModel.findOneAndUpdate(
    { googleId },
    {
      $set: {
        email,
        name: input.name,
        role: input.role,
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
      $setOnInsert: { googleId },
    },
    { upsert: true, new: true },
  );
  return user as unknown as UserDoc;
}

export async function upsertGoogleUser(input: {
  googleId: string;
  email: string;
  name: string;
}): Promise<UserDoc> {
  const user = await UserModel.findOneAndUpdate(
    { googleId: input.googleId },
    {
      $set: {
        email: input.email,
        name: input.name,
      },
      $setOnInsert: {
        role: 'member',
      },
    },
    { upsert: true, new: true },
  );
  return user as unknown as UserDoc;
}

export async function updateUserPhone(userId: string, phone: string) {
  const updated = await UserModel.findByIdAndUpdate(userId, { $set: { phone } }, { new: true });
  if (updated) {
    await delKeys([`tp:v1:user:${userId}`, 'tp:v1:users:members']);
  }
  return updated;
}

