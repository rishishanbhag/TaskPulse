import { env } from '@/config/env.js';
import {
  createInviteForOrg,
  devJoinWithCode,
  devSignupWithOrgName,
  getMyOrganization,
  joinWithGoogleAndCode,
  listInvitesForOrg,
  listMembers,
  removeMemberFromOrg,
  signupWithGoogleAndOrgName,
  updateMemberRole,
} from '@/services/orgService.js';
import type { Role } from '@/types/role.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

function publicUrl() {
  return env.PUBLIC_URL.replace(/\/$/, '');
}

export const orgController = {
  signup: asyncHandler(async (req, res) => {
    const { idToken, orgName } = req.body as { idToken: string; orgName: string };
    const out = await signupWithGoogleAndOrgName({ idToken, orgName });
    res.status(201).json(out);
  }),

  join: asyncHandler(async (req, res) => {
    const { idToken, code } = req.body as { idToken: string; code: string };
    const out = await joinWithGoogleAndCode({ idToken, code });
    res.status(201).json(out);
  }),

  devSignup: asyncHandler(async (req, res) => {
    const b = req.body as { email: string; name?: string; orgName: string; phone?: string };
    const out = await devSignupWithOrgName({
      email: b.email,
      name: b.name ?? b.email.split('@')[0] ?? 'Dev User',
      orgName: b.orgName,
      phone: b.phone,
    });
    res.status(201).json(out);
  }),

  devJoin: asyncHandler(async (req, res) => {
    const b = req.body as { email: string; name?: string; code: string; phone?: string };
    const out = await devJoinWithCode({ email: b.email, name: b.name || '', code: b.code, phone: b.phone });
    res.status(201).json(out);
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const org = await getMyOrganization(req.user.orgId);
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } });
    res.json({
      org: { id: String(org._id), name: org.name, slug: org.slug, ownerId: String((org as any).ownerId) },
      user: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, orgId: req.user.orgId, role: req.user.role },
    });
  }),

  listMembers: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const members = await listMembers({ orgId: req.user.orgId, role });
    res.json({
      members: members.map((u) => ({
        id: String((u as any)._id),
        name: (u as any).name,
        email: (u as any).email,
        phone: (u as any).phone ?? null,
        role: (u as any).role,
      })),
    });
  }),

  patchMemberRole: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { role: newRole } = req.body as { role: Role };
    const targetUserId = req.params.userId;
    const u = await updateMemberRole({
      orgId: req.user.orgId,
      targetUserId,
      newRole,
      actor: req.user.role,
    });
    res.json({
      user: {
        id: String((u as any)._id),
        name: (u as any).name,
        email: (u as any).email,
        role: (u as any).role,
      },
    });
  }),

  removeMember: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const targetUserId = req.params.userId;
    await removeMemberFromOrg({ orgId: req.user.orgId, targetUserId, actorRole: req.user.role });
    res.status(204).send();
  }),

  createInvite: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { defaultRole, expiresInHours } = req.body as { defaultRole: 'admin' | 'manager' | 'member'; expiresInHours?: number };
    const inv = await createInviteForOrg({
      orgId: req.user.orgId,
      createdBy: req.user.id,
      defaultRole,
      expiresInHours,
    });
    const code = (inv as any).code;
    res.status(201).json({
      invite: { code, expiresAt: (inv as any).expiresAt ?? null },
      url: `${publicUrl()}/signup?code=${encodeURIComponent(code)}`,
    });
  }),

  listInvites: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const list = await listInvitesForOrg(req.user.orgId);
    res.json({ invites: list });
  }),
};
