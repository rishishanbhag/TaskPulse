import { UserModel, type UserDoc } from '@/models/User.js';

export async function getUserByGoogleId(googleId: string) {
  return UserModel.findOne({ googleId });
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
  return UserModel.findByIdAndUpdate(userId, { $set: { phone } }, { new: true });
}

