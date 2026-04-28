import { UserModel } from '@/models/User.js';
import type { Role } from '@/types/role.js';
import { verifyGoogleIdToken } from '@/utils/googleIdToken.js';
import { signJwt } from '@/utils/jwt.js';
import { isValidOrgIdString } from '@/utils/validateOrgId.js';

type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orgId: string;
  role: Role;
};

function toPublic(u: { _id: unknown; name: string; email: string; phone?: string | null; orgId: unknown; role: string }): PublicUser {
  const rawOrg = (u as any).orgId;
  if (!isValidOrgIdString(rawOrg)) {
    const err = new Error(
      'You are not linked to an organization yet. Create one or join with an invite—use the sign-up page to get started.',
    );
    (err as any).statusCode = 403;
    (err as any).code = 'NEEDS_ORGANIZATION';
    throw err;
  }
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    orgId: rawOrg,
    role: u.role as Role,
  };
}

export async function loginWithGoogleIdToken(idToken: string) {
  const p = await verifyGoogleIdToken(idToken);
  const user = await UserModel.findOne({ googleId: p.sub }).lean();
  if (!user) {
    const err = new Error('No account found. Create an organization or join with an invite code first.');
    (err as any).statusCode = 401;
    throw err;
  }
  const publicUser = toPublic(user as any);
  const token = signJwt({ sub: publicUser.id, orgId: publicUser.orgId, role: publicUser.role });
  return { token, user: publicUser };
}

export async function loginWithDevEmail(email: string) {
  const e = email.trim().toLowerCase();
  const user = await UserModel.findOne({ googleId: `dev:${e}` }).lean();
  if (!user) {
    const err = new Error('No account found. Use dev sign-up to create an org, or dev join with an invite.');
    (err as any).statusCode = 401;
    throw err;
  }
  const publicUser = toPublic(user as any);
  const token = signJwt({ sub: publicUser.id, orgId: publicUser.orgId, role: publicUser.role });
  return { token, user: publicUser };
}
