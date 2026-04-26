import mongoose from 'mongoose';

import { AssignmentModel } from '@/models/Assignment.js';
import { GroupModel } from '@/models/Group.js';
import { TaskModel, TaskStatus } from '@/models/Task.js';
import { UserModel, UserRole } from '@/models/User.js';
import {
  addUserIdsToGroup,
  assertAllAssigneesInGroup,
  getGroupIdsForManager,
  getMemberGroupObjectIdsForUser,
} from '@/services/groupService.js';
import { cached, delByPattern, delKeys } from '@/services/cache.js';
import { upsertAssignmentsForTask } from '@/services/assignmentService.js';
import { generateUniqueTaskShortCode } from '@/utils/shortCode.js';
import { htmlToPlain, sanitizeDescriptionHtml } from '@/utils/sanitizeDescription.js';
import type { AuthedUser } from '@/types/user.js';

const TTL_TASK_LIST_SECONDS = 30;
const TTL_TASK_DETAIL_SECONDS = 30;

function cacheKeyTasksListAdmin(orgId: string) {
  return `tp:v1:org:${orgId}:tasks:list:admin`;
}
function cacheKeyTasksListUser(orgId: string, userId: string) {
  return `tp:v1:org:${orgId}:tasks:list:user:${userId}`;
}
function cacheKeyTasksListManager(orgId: string, userId: string) {
  return `tp:v1:org:${orgId}:tasks:list:manager:${userId}`;
}
function cacheKeyTaskDetail(orgId: string, taskId: string) {
  return `tp:v1:org:${orgId}:task:${taskId}:detail`;
}
function cacheKeyTaskAssignments(taskId: string) {
  return `tp:v1:task:${taskId}:assignments`;
}

export function cacheKeysForTaskMutations(orgId: string, taskId: string) {
  return [cacheKeyTaskDetail(orgId, taskId), cacheKeyTaskAssignments(taskId), cacheKeyTasksListAdmin(orgId)];
}

export async function invalidateTaskListsForOrg(orgId: string) {
  await delKeys([cacheKeyTasksListAdmin(orgId)]);
  await delByPattern(`tp:v1:org:${orgId}:tasks:list:user:*`);
  await delByPattern(`tp:v1:org:${orgId}:tasks:list:manager:*`);
}

/** @deprecated use invalidateTaskListsForOrg */
export async function invalidateTaskLists() {
  await delByPattern('tp:v1:org:*:tasks:list:*');
}

async function assertAssigneesInOrg(orgId: string, assigneeIds: string[]) {
  const oids = assigneeIds.map((id) => new mongoose.Types.ObjectId(id));
  const n = await UserModel.countDocuments({ _id: { $in: oids }, orgId: new mongoose.Types.ObjectId(orgId) });
  if (n !== assigneeIds.length) {
    const err = new Error('One or more assignees are not in this organization');
    (err as any).statusCode = 400;
    throw err;
  }
}

function assertCanCreateTask(actor: AuthedUser, groupId: string | null | undefined) {
  if (actor.role === UserRole.MANAGER) {
    if (!groupId) {
      const err = new Error('Managers must create tasks in a group');
      (err as any).statusCode = 400;
      throw err;
    }
  }
  if (actor.role === UserRole.MEMBER) {
    const err = new Error('Members cannot create tasks');
    (err as any).statusCode = 403;
    throw err;
  }
  if (actor.role === UserRole.OWNER || actor.role === UserRole.ADMIN) {
    // ok, group optional
  }
}

async function assertManagerInGroupIfNeeded(actor: AuthedUser, groupId: string | null | undefined) {
  if (actor.role !== UserRole.MANAGER || !groupId) return;
  const g = await GroupModel.findOne({
    _id: new mongoose.Types.ObjectId(groupId),
    orgId: new mongoose.Types.ObjectId(actor.orgId),
    members: new mongoose.Types.ObjectId(actor.id),
  }).lean();
  if (!g) {
    const err = new Error('Not allowed for this group');
    (err as any).statusCode = 403;
    throw err;
  }
}

export async function createTask(
  input: {
    orgId: string;
    groupId?: string | null;
    title: string;
    descriptionHtml: string;
    createdBy: string;
    assignedTo: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: Date;
    scheduledAt?: Date;
  },
  actor: AuthedUser,
) {
  assertCanCreateTask(actor, input.groupId ?? null);
  await assertManagerInGroupIfNeeded(actor, input.groupId ?? null);
  const gid = input.groupId ? new mongoose.Types.ObjectId(input.groupId) : null;
  if (!gid) {
    if (actor.role !== UserRole.OWNER && actor.role !== UserRole.ADMIN) {
      const err = new Error('Group is required for this action');
      (err as any).statusCode = 400;
      throw err;
    }
  } else {
    const g = await GroupModel.findOne({ _id: gid, orgId: input.orgId }).lean();
    if (!g) {
      const err = new Error('Group not found');
      (err as any).statusCode = 404;
      throw err;
    }
  }

  await assertAssigneesInOrg(input.orgId, input.assignedTo);
  if (gid) {
    if (actor.role === UserRole.OWNER || actor.role === UserRole.ADMIN) {
      await addUserIdsToGroup(input.orgId, String(gid), input.assignedTo);
    }
    await assertAllAssigneesInGroup(input.orgId, gid, input.assignedTo);
  }

  const shortCode = await generateUniqueTaskShortCode(input.orgId);
  const descriptionHtml = sanitizeDescriptionHtml(input.descriptionHtml);
  const description = htmlToPlain(descriptionHtml);
  if (!description) {
    const err = new Error('Description is empty after sanitization');
    (err as any).statusCode = 400;
    throw err;
  }

  const task = await TaskModel.create({
    orgId: new mongoose.Types.ObjectId(input.orgId),
    ...(gid ? { groupId: gid } : {}),
    shortCode,
    title: input.title,
    description,
    descriptionHtml,
    createdBy: new mongoose.Types.ObjectId(input.createdBy),
    assignedTo: input.assignedTo.map((id) => new mongoose.Types.ObjectId(id)),
    ...(input.priority ? { priority: input.priority } : {}),
    deadline: input.deadline,
    scheduledAt: input.scheduledAt,
    status: TaskStatus.DRAFT,
  });

  await invalidateTaskListsForOrg(input.orgId);
  return task;
}

async function getTaskInOrg(taskId: string, orgId: string) {
  return TaskModel.findOne({ _id: taskId, orgId: new mongoose.Types.ObjectId(orgId) });
}

export async function approveTask(taskId: string, user: AuthedUser) {
  const task = await getTaskInOrg(taskId, user.orgId);
  if (!task) {
    const err = new Error('Task not found');
    (err as any).statusCode = 404;
    throw err;
  }
  if (user.role === UserRole.MEMBER) {
    const err = new Error('Forbidden');
    (err as any).statusCode = 403;
    throw err;
  }
  if (user.role === UserRole.MANAGER) {
    const ids = await getGroupIdsForManager(user);
    if (!task.groupId || !ids.map(String).includes(String(task.groupId))) {
      const err = new Error('Forbidden');
      (err as any).statusCode = 403;
      throw err;
    }
  }

  if (task.status !== TaskStatus.DRAFT) {
    const err = new Error(`Task cannot be approved from status ${task.status}`);
    (err as any).statusCode = 400;
    throw err;
  }

  task.status = TaskStatus.APPROVED;
  await task.save();

  await upsertAssignmentsForTask(new mongoose.Types.ObjectId(user.orgId), task._id, task.assignedTo.map(String));
  await delKeys([...cacheKeysForTaskMutations(user.orgId, String(task._id))]);
  await invalidateTaskListsForOrg(user.orgId);
  return task;
}

export async function rescheduleTask(taskId: string, scheduledAt: Date, user: AuthedUser) {
  const task = await getTaskInOrg(taskId, user.orgId);
  if (!task) {
    const err = new Error('Task not found');
    (err as any).statusCode = 404;
    throw err;
  }
  if (user.role === UserRole.MEMBER) {
    const err = new Error('Forbidden');
    (err as any).statusCode = 403;
    throw err;
  }
  if (user.role === UserRole.MANAGER) {
    const ids = await getGroupIdsForManager(user);
    if (!task.groupId || !ids.map(String).includes(String(task.groupId))) {
      const err = new Error('Forbidden');
      (err as any).statusCode = 403;
      throw err;
    }
  }

  task.scheduledAt = scheduledAt;
  await task.save();
  await delKeys([...cacheKeysForTaskMutations(user.orgId, String(task._id))]);
  await invalidateTaskListsForOrg(user.orgId);
  return task;
}

export async function listTasksForUser(user: AuthedUser) {
  const orgOid = new mongoose.Types.ObjectId(user.orgId);
  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return cached(cacheKeyTasksListAdmin(user.orgId), TTL_TASK_LIST_SECONDS, async () => {
      return TaskModel.find({ orgId: orgOid }).sort({ createdAt: -1 }).lean();
    });
  }
  if (user.role === UserRole.MANAGER) {
    return cached(cacheKeyTasksListManager(user.orgId, user.id), TTL_TASK_LIST_SECONDS, async () => {
      const gids = await getGroupIdsForManager(user);
      if (gids.length === 0) return [];
      return TaskModel.find({ orgId: orgOid, groupId: { $in: gids.map((g) => new mongoose.Types.ObjectId(g)) } })
        .sort({ createdAt: -1 })
        .lean();
    });
  }
  // member: assigned, and (no group on task or user in group)
  return cached(cacheKeyTasksListUser(user.orgId, user.id), TTL_TASK_LIST_SECONDS, async () => {
    const myGroups = await getMemberGroupObjectIdsForUser(user);
    const tasks = await TaskModel.find({
      orgId: orgOid,
      assignedTo: new mongoose.Types.ObjectId(user.id),
      $or: [{ groupId: { $in: myGroups } }, { groupId: { $eq: null } }, { groupId: { $exists: false } }],
    })
      .sort({ createdAt: -1 })
      .lean();
    if (tasks.length === 0) return tasks;
    const taskIds = tasks.map((t) => t._id);
    const mine = await AssignmentModel.find({
      taskId: { $in: taskIds },
      userId: new mongoose.Types.ObjectId(user.id),
    })
      .select('taskId _id status')
      .lean();
    const byTask = new Map(mine.map((a) => [String(a.taskId), a]));
    return tasks.map((t) => {
      const a = byTask.get(String(t._id));
      return a ? { ...t, myAssignment: { _id: String(a._id), status: a.status } } : t;
    });
  });
}

export async function getTaskForUser(taskId: string, user: AuthedUser) {
  const orgOid = new mongoose.Types.ObjectId(user.orgId);
  const task = await cached(
    cacheKeyTaskDetail(user.orgId, taskId),
    TTL_TASK_DETAIL_SECONDS,
    async () => TaskModel.findOne({ _id: taskId, orgId: orgOid }).lean(),
  );
  if (!task) return null;

  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) return task;
  if (user.role === UserRole.MANAGER) {
    const gids = await getGroupIdsForManager(user);
    if (!task.groupId) return null;
    if (!gids.map(String).includes(String(task.groupId))) return null;
    return task;
  }
  // member
  const assigned = ((task.assignedTo as any[]) ?? []).map(String);
  if (!assigned.includes(user.id)) return null;
  if (task.groupId) {
    const g = await GroupModel.findOne({
      _id: task.groupId,
      orgId: orgOid,
      members: new mongoose.Types.ObjectId(user.id),
    })
      .select('_id')
      .lean();
    if (!g) return null;
  }
  return task;
}
