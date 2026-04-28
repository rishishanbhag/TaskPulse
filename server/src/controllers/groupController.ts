import mongoose from 'mongoose';

import { GroupModel } from '@/models/Group.js';
import { UserRole } from '@/models/User.js';
import { addMemberToGroup, createGroup, deleteGroup, listGroupsForUser, removeMemberFromGroup, renameGroup } from '@/services/groupService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
export const groupController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const groups = await listGroupsForUser({
      id: req.user.id,
      orgId: req.user.orgId,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    });
    res.json({ groups: groups.map((g) => ({ ...g, _id: String((g as any)._id) })) });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { name } = req.body as { name: string };
    const g = await createGroup({ orgId: req.user.orgId, name, createdBy: req.user.id });
    res.status(201).json({ group: g });
  }),

  update: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { name } = req.body as { name: string };
    const g = await renameGroup({ orgId: req.user.orgId, groupId: req.params.id, name });
    if (!g) return res.status(404).json({ error: { message: 'Group not found' } });
    res.json({ group: g });
  }),

  remove: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const ok = await deleteGroup({ orgId: req.user.orgId, groupId: req.params.id });
    if (!ok) return res.status(404).json({ error: { message: 'Group not found' } });
    res.status(204).send();
  }),

  addMember: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { userId } = req.body as { userId: string };
    const groupId = req.params.id;

    if (req.user.role === UserRole.MANAGER) {
      const g = await GroupModel.findOne({ _id: groupId, orgId: req.user.orgId, members: new mongoose.Types.ObjectId(req.user.id) }).lean();
      if (!g) return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    if (req.user.role === UserRole.OWNER || req.user.role === UserRole.ADMIN) {
      // ok
    } else if (req.user.role !== UserRole.MANAGER) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const r = await addMemberToGroup({ orgId: req.user.orgId, groupId, userId });
    if (!r.ok) {
      if (r.reason === 'user_not_in_org') return res.status(400).json({ error: { message: 'User is not in this organization' } });
    }
    res.json({ ok: true });
  }),

  removeMember: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const groupId = req.params.id;
    const userId = req.params.userId;

    if (req.user.role === UserRole.MANAGER) {
      const g = await GroupModel.findOne({ _id: groupId, orgId: req.user.orgId, members: new mongoose.Types.ObjectId(req.user.id) }).lean();
      if (!g) return res.status(403).json({ error: { message: 'Forbidden' } });
    } else if (req.user.role !== UserRole.OWNER && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    await removeMemberFromGroup({ orgId: req.user.orgId, groupId, userId });
    res.json({ ok: true });
  }),
};
