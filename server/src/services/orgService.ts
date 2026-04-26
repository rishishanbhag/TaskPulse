import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

import { InviteDefaultRole, InviteModel } from '@/models/Invite.js';
import { OrganizationModel } from '@/models/Organization.js';
import { UserModel, UserRole } from '@/models/User.js';
import { delKeys } from '@/services/cache.js';
import { signJwt } from '@/utils/jwt.js';
import { verifyGoogleIdToken } from '@/utils/googleIdToken.js';
import { isValidOrgIdString } from '@/utils/validateOrgId.js';
import type { Role } from '@/types/role.js';

const codeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const inviteCode = customAlphabet(codeAlphabet, 10);

function slugifyName(name: string) {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  return s || 'org';
}

function uniqueOrgSlug(name: string) {
  return `${slugifyName(name)}-${customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)()}`;
}

type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orgId: string;
  role: Role;
};

function toSession(user: { _id: unknown; name: string; email: string; phone?: string | null; orgId: unknown; role: string }) {
  const u: PublicUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    orgId: String(user.orgId),
    role: user.role as Role,
  };
  const token = signJwt({ sub: u.id, orgId: u.orgId, role: u.role });
  return { token, user: u };
}

function invalidateUserCache(userId: string) {
  return delKeys([`tp:v1:user:${userId}`]);
}

export async function signupWithGoogleAndOrgName(input: { idToken: string; orgName: string }) {
  const p = await verifyGoogleIdToken(input.idToken);
  const existing = await UserModel.findOne({ googleId: p.sub }).lean();
  if (existing) {
    const err = new Error('Account already exists. Use Sign in instead.');
    (err as any).statusCode = 400;
    throw err;
  }

  const orgName = input.orgName.trim();
  if (!orgName) {
    const err = new Error('Organization name is required');
    (err as any).statusCode = 400;
    throw err;
  }

  const userId = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const slug = uniqueOrgSlug(orgName);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await OrganizationModel.create(
        [
          {
            _id: orgId,
            name: orgName,
            slug,
            ownerId: userId,
          },
        ],
        { session },
      );

      await UserModel.create(
        [
          {
            _id: userId,
            orgId,
            email: p.email,
            name: p.name,
            googleId: p.sub,
            role: UserRole.OWNER,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  const user = (await UserModel.findById(userId).lean()) as any;
  if (!user) {
    const err = new Error('User creation failed');
    (err as any).statusCode = 500;
    throw err;
  }
  return toSession(user);
}

export async function joinWithGoogleAndCode(input: { idToken: string; code: string }) {
  const p = await verifyGoogleIdToken(input.idToken);

  const invite = await InviteModel.findOne({ code: input.code.trim() }).lean();
  if (!invite) {
    const err = new Error('Invalid or expired invite code');
    (err as any).statusCode = 400;
    throw err;
  }
  if (invite.usedAt) {
    const err = new Error('Invite already used');
    (err as any).statusCode = 400;
    throw err;
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    const err = new Error('Invite has expired');
    (err as any).statusCode = 400;
    throw err;
  }

  const role = invite.defaultRole as Role;
  const existing = await UserModel.findOne({ googleId: p.sub }).lean();

  if (existing) {
    if (isValidOrgIdString((existing as any).orgId)) {
      const err = new Error(
        'This Google account already belongs to an organization. Use Sign in, or use a different Google account with this invite.',
      );
      (err as any).statusCode = 400;
      throw err;
    }

    const u = await UserModel.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          orgId: invite.orgId,
          role,
          name: p.name || (existing as any).name,
          email: (p.email ?? (existing as any).email).toLowerCase(),
        },
      },
      { new: true },
    ).lean();
    if (!u) {
      const err = new Error('Failed to join organization');
      (err as any).statusCode = 500;
      throw err;
    }
    await InviteModel.updateOne(
      { _id: invite._id },
      { $set: { usedBy: u._id, usedAt: new Date() } },
    );
    await delKeys([`tp:v1:org:${String(invite.orgId)}:users:members`, `tp:v1:user:${String(u._id)}`]);
    return toSession(u);
  }

  const u = await UserModel.create({
    orgId: invite.orgId,
    email: p.email,
    name: p.name,
    googleId: p.sub,
    role,
  });
  await InviteModel.updateOne(
    { _id: invite._id },
    { $set: { usedBy: u._id, usedAt: new Date() } },
  );
  await delKeys([`tp:v1:org:${String(invite.orgId)}:users:members`]);
  return toSession(u);
}

export async function devSignupWithOrgName(input: { email: string; name: string; orgName: string; phone?: string | null }) {
  const email = input.email.trim().toLowerCase();
  const googleId = `dev:${email}`;
  const existing = await UserModel.findOne({ googleId }).lean();
  if (existing) {
    const err = new Error('Account already exists. Use Sign in with dev or Google.');
    (err as any).statusCode = 400;
    throw err;
  }
  const orgName = input.orgName.trim();
  const name = input.name || email.split('@')[0] || 'Dev User';
  const userId = new mongoose.Types.ObjectId();
  const slug = uniqueOrgSlug(orgName);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const org = await OrganizationModel.create(
        [
          {
            name: orgName,
            slug,
            ownerId: userId,
          },
        ],
        { session },
      );
      const o = org[0] as any;
      await UserModel.create(
        [
          {
            _id: userId,
            orgId: o._id,
            email,
            name,
            googleId,
            role: UserRole.OWNER,
            ...(input.phone ? { phone: input.phone } : {}),
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  const user = (await UserModel.findById(userId).lean()) as any;
  return toSession(user);
}

export async function devJoinWithCode(input: { email: string; name: string; code: string; phone?: string | null }) {
  const email = input.email.trim().toLowerCase();
  const googleId = `dev:${email}`;
  const name = input.name || email.split('@')[0] || 'Dev User';

  const invite = await InviteModel.findOne({ code: input.code.trim() }).lean();
  if (!invite || invite.usedAt) {
    const err = new Error('Invalid or expired invite code');
    (err as any).statusCode = 400;
    throw err;
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    const err = new Error('Invite has expired');
    (err as any).statusCode = 400;
    throw err;
  }
  const role = invite.defaultRole as Role;

  const existing = await UserModel.findOne({ googleId }).lean();
  if (existing) {
    if (isValidOrgIdString((existing as any).orgId)) {
      const err = new Error('This dev account already belongs to an organization. Use dev sign in, or another email for this invite.');
      (err as any).statusCode = 400;
      throw err;
    }

    const u = await UserModel.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          orgId: invite.orgId,
          role,
          name: name || (existing as any).name,
          email,
          ...(input.phone != null && input.phone !== '' ? { phone: input.phone } : {}),
        },
      },
      { new: true },
    ).lean();
    if (!u) {
      const err = new Error('Failed to join organization');
      (err as any).statusCode = 500;
      throw err;
    }
    await InviteModel.updateOne(
      { _id: invite._id },
      { $set: { usedBy: u._id, usedAt: new Date() } },
    );
    await delKeys([`tp:v1:org:${String(invite.orgId)}:users:members`, `tp:v1:user:${String(u._id)}`]);
    return toSession(u);
  }

  const u = await UserModel.create({
    orgId: invite.orgId,
    email,
    name,
    googleId,
    role,
    ...(input.phone ? { phone: input.phone } : {}),
  });
  await InviteModel.updateOne(
    { _id: invite._id },
    { $set: { usedBy: u._id, usedAt: new Date() } },
  );
  await delKeys([`tp:v1:org:${String(invite.orgId)}:users:members`]);
  return toSession(u);
}

export async function getMyOrganization(orgId: string) {
  return OrganizationModel.findById(orgId).lean();
}

export async function listMembers(input: { orgId: string; role?: string }) {
  const q: Record<string, unknown> = { orgId: new mongoose.Types.ObjectId(input.orgId) };
  if (input.role && ['owner', 'admin', 'manager', 'member'].includes(input.role)) {
    q.role = input.role;
  }
  return UserModel.find(q).sort({ name: 1 }).lean();
}

const mutableRoles: Role[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER];

export async function updateMemberRole(input: { orgId: string; targetUserId: string; newRole: Role; actor: Role }) {
  if (input.actor !== UserRole.OWNER) {
    const err = new Error('Only the owner can change roles');
    (err as any).statusCode = 403;
    throw err;
  }
  if (!mutableRoles.includes(input.newRole) || input.newRole === UserRole.OWNER) {
    const err = new Error('Invalid role');
    (err as any).statusCode = 400;
    throw err;
  }
  const org = await OrganizationModel.findById(input.orgId).lean();
  if (!org) {
    const err = new Error('Org not found');
    (err as any).statusCode = 404;
    throw err;
  }
  if (String((org as any).ownerId) === input.targetUserId) {
    const err = new Error('Cannot change the organization owner role here');
    (err as any).statusCode = 400;
    throw err;
  }
  const u = await UserModel.findOneAndUpdate(
    { _id: input.targetUserId, orgId: input.orgId },
    { $set: { role: input.newRole } },
    { new: true },
  );
  if (!u) {
    const err = new Error('User not found');
    (err as any).statusCode = 404;
    throw err;
  }
  await invalidateUserCache(input.targetUserId);
  await delKeys([`tp:v1:org:${input.orgId}:users:members`]);
  return u;
}

export async function removeMemberFromOrg(input: { orgId: string; targetUserId: string; actorRole: Role }) {
  if (input.actorRole !== UserRole.OWNER && input.actorRole !== UserRole.ADMIN) {
    const err = new Error('Forbidden');
    (err as any).statusCode = 403;
    throw err;
  }
  const org = await OrganizationModel.findById(input.orgId).lean();
  if (!org) {
    const err = new Error('Org not found');
    (err as any).statusCode = 404;
    throw err;
  }
  if (String((org as any).ownerId) === input.targetUserId) {
    const err = new Error('Cannot remove the organization owner');
    (err as any).statusCode = 400;
    throw err;
  }
  const u = await UserModel.findOne({ _id: input.targetUserId, orgId: input.orgId }).lean();
  if (!u) {
    const err = new Error('User not found');
    (err as any).statusCode = 404;
    throw err;
  }
  if (input.actorRole === UserRole.ADMIN && (u as any).role === UserRole.ADMIN) {
    const err = new Error('Admins cannot remove other admins');
    (err as any).statusCode = 403;
    throw err;
  }
  await UserModel.deleteOne({ _id: input.targetUserId, orgId: input.orgId });
  await invalidateUserCache(input.targetUserId);
  await delKeys([`tp:v1:org:${input.orgId}:users:members`]);
}

export async function createInviteForOrg(input: {
  orgId: string;
  createdBy: string;
  defaultRole: (typeof InviteDefaultRole)[keyof typeof InviteDefaultRole];
  expiresInHours?: number;
}) {
  const code = inviteCode();
  const expiresAt =
    input.expiresInHours && input.expiresInHours > 0
      ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
      : undefined;
  const inv = await InviteModel.create({
    orgId: new mongoose.Types.ObjectId(input.orgId),
    code,
    defaultRole: input.defaultRole,
    expiresAt,
    createdBy: new mongoose.Types.ObjectId(input.createdBy),
  });
  return inv;
}

export async function listInvitesForOrg(orgId: string) {
  return InviteModel.find({ orgId })
    .sort({ createdAt: -1 })
    .lean();
}
