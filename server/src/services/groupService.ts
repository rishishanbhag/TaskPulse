import mongoose from 'mongoose';

import { GroupModel } from '@/models/Group.js';
import { UserModel, UserRole } from '@/models/User.js';
import { delByPattern } from '@/services/cache.js';
import type { AuthedUser } from '@/types/user.js';

const cachePatternOrgGroups = (orgId: string) => `tp:v1:org:${orgId}:groups:*`;

export async function listGroupsForUser(user: AuthedUser) {
  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return GroupModel.find({ orgId: user.orgId }).sort({ name: 1 }).lean();
  }
  return GroupModel.find({ orgId: user.orgId, members: new mongoose.Types.ObjectId(user.id) })
    .sort({ name: 1 })
    .lean();
}

export async function getGroupIdsForManager(user: AuthedUser) {
  if (user.role !== UserRole.MANAGER) return [];
  const rows = await GroupModel.find({ orgId: user.orgId, members: new mongoose.Types.ObjectId(user.id) })
    .select('_id')
    .lean();
  return rows.map((g) => String(g._id));
}

export async function getMemberGroupObjectIdsForUser(user: AuthedUser) {
  const rows = await GroupModel.find({ orgId: user.orgId, members: new mongoose.Types.ObjectId(user.id) })
    .select('_id')
    .lean();
  return rows.map((g) => g._id);
}

export async function createGroup(input: { orgId: string; name: string; createdBy: string }) {
  const g = await GroupModel.create({
    orgId: new mongoose.Types.ObjectId(input.orgId),
    name: input.name,
    createdBy: new mongoose.Types.ObjectId(input.createdBy),
    members: [],
  });
  await delKeysByOrgGroupsPattern(input.orgId);
  return g;
}

export async function renameGroup(input: { orgId: string; groupId: string; name: string }) {
  const g = await GroupModel.findOneAndUpdate(
    { _id: input.groupId, orgId: input.orgId },
    { $set: { name: input.name } },
    { new: true },
  );
  if (g) await delKeysByOrgGroupsPattern(input.orgId);
  return g;
}

export async function deleteGroup(input: { orgId: string; groupId: string }) {
  const r = await GroupModel.deleteOne({ _id: input.groupId, orgId: input.orgId });
  if (r.deletedCount) await delKeysByOrgGroupsPattern(input.orgId);
  return r.deletedCount > 0;
}

export async function addMemberToGroup(input: { orgId: string; groupId: string; userId: string }) {
  const u = await UserModel.findOne({ _id: input.userId, orgId: input.orgId }).select('_id').lean();
  if (!u) return { ok: false as const, reason: 'user_not_in_org' as const };

  await GroupModel.updateOne(
    { _id: input.groupId, orgId: input.orgId },
    { $addToSet: { members: new mongoose.Types.ObjectId(input.userId) } },
  );
  await delKeysByOrgGroupsPattern(input.orgId);
  return { ok: true as const };
}

/** Add many org users to a group (e.g. when an owner creates a group-scoped task and picks assignees). */
export async function addUserIdsToGroup(orgId: string, groupId: string, userIds: string[]) {
  if (userIds.length === 0) return;
  const orgOid = new mongoose.Types.ObjectId(orgId);
  const distinct = Array.from(new Set(userIds));
  const oids = distinct.map((id) => new mongoose.Types.ObjectId(id));
  const n = await UserModel.countDocuments({ _id: { $in: oids }, orgId: orgOid });
  if (n !== distinct.length) {
    const err = new Error('One or more users are not in this organization');
    (err as any).statusCode = 400;
    throw err;
  }
  await GroupModel.updateOne(
    { _id: new mongoose.Types.ObjectId(groupId), orgId: orgOid },
    { $addToSet: { members: { $each: oids } } },
  );
  await delKeysByOrgGroupsPattern(orgId);
}

export async function removeMemberFromGroup(input: { orgId: string; groupId: string; userId: string }) {
  await GroupModel.updateOne(
    { _id: input.groupId, orgId: input.orgId },
    { $pull: { members: new mongoose.Types.ObjectId(input.userId) } },
  );
  await delKeysByOrgGroupsPattern(input.orgId);
}

async function delKeysByOrgGroupsPattern(orgId: string) {
  await delByPattern(cachePatternOrgGroups(orgId));
}

export async function assertUserInGroup(orgId: string, groupId: string | null | undefined, userId: string) {
  if (!groupId) return true;
  const g = await GroupModel.findOne({ _id: groupId, orgId, members: new mongoose.Types.ObjectId(userId) })
    .select('_id')
    .lean();
  return !!g;
}

export async function assertAllAssigneesInGroup(
  orgId: string,
  groupId: mongoose.Types.ObjectId | null,
  assigneeIds: string[],
) {
  if (!groupId) return;
  const g = await GroupModel.findOne({ _id: groupId, orgId }).lean();
  if (!g) {
    const err = new Error('Group not found');
    (err as any).statusCode = 404;
    throw err;
  }
  const set = new Set((g.members as any[]).map((x) => String(x)));
  for (const id of assigneeIds) {
    if (!set.has(id)) {
      const err = new Error('All assignees must be members of the selected group');
      (err as any).statusCode = 400;
      throw err;
    }
  }
}
