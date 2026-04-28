import mongoose from 'mongoose';

import { AssignmentModel, AssignmentReplyType, AssignmentStatus } from '@/models/Assignment.js';
import { TaskModel, TaskStatus } from '@/models/Task.js';
import { delKeys } from '@/services/cache.js';
import { publishEvent } from '@/services/events.js';
import type { ReplyParseResult } from '@/services/replyParser.js';
import { cacheKeysForTaskMutations, invalidateTaskListsForOrg } from '@/services/taskService.js';

export function openAssignmentStatuses() {
  return [AssignmentStatus.SENT, AssignmentStatus.DELIVERED, AssignmentStatus.PENDING] as const;
}

export async function applyAssignmentReply(input: {
  assignment: InstanceType<typeof AssignmentModel>;
  task: { _id: mongoose.Types.ObjectId; orgId: mongoose.Types.ObjectId; groupId?: mongoose.Types.ObjectId | null; assignedTo?: unknown };
  orgIdStr: string;
  userIdStr: string;
  parsed: ReplyParseResult;
  replyBody: string;
}) {
  const now = new Date();
  const assignment = input.assignment;

  assignment.lastReplyAt = now;
  assignment.lastReplyBody = input.replyBody.slice(0, 1000);

  if (input.parsed.type === 'DONE') {
    assignment.lastReplyType = AssignmentReplyType.DONE;
    assignment.status = AssignmentStatus.COMPLETED;
    assignment.updatedAt = now;
  } else if (input.parsed.type === 'HELP') {
    assignment.lastReplyType = AssignmentReplyType.HELP;
    assignment.helpRequestedAt = now;
    assignment.updatedAt = now;
  } else if (input.parsed.type === 'DELAY') {
    assignment.lastReplyType = AssignmentReplyType.DELAY;
    if (input.parsed.until) assignment.delayRequestedUntil = input.parsed.until;
    assignment.updatedAt = now;
  } else {
    assignment.lastReplyType = AssignmentReplyType.UNKNOWN;
    assignment.updatedAt = now;
  }

  await assignment.save();

  const taskIdStr = String(assignment.taskId);
  await delKeys([...cacheKeysForTaskMutations(input.orgIdStr, taskIdStr)]);
  await invalidateTaskListsForOrg(input.orgIdStr);

  const groupIdVal = input.task.groupId ? String(input.task.groupId) : null;

  if (input.parsed.type === 'DONE') {
    await publishEvent({
      type: 'assignment.updated',
      orgId: input.orgIdStr,
      groupId: groupIdVal,
      taskId: taskIdStr,
      assignmentId: String(assignment._id),
      userId: input.userIdStr,
      status: AssignmentStatus.COMPLETED,
    });
  } else if (input.parsed.type === 'HELP') {
    await publishEvent({
      type: 'assignment.help_requested',
      orgId: input.orgIdStr,
      groupId: groupIdVal,
      taskId: taskIdStr,
      assignmentId: String(assignment._id),
      userId: input.userIdStr,
    });
  } else if (input.parsed.type === 'DELAY') {
    await publishEvent({
      type: 'assignment.delay_requested',
      orgId: input.orgIdStr,
      groupId: groupIdVal,
      taskId: taskIdStr,
      assignmentId: String(assignment._id),
      userId: input.userIdStr,
      ...(input.parsed.until ? { until: input.parsed.until.toISOString() } : {}),
    });
  }

  if (input.parsed.type === 'DONE') {
    const remaining = await AssignmentModel.countDocuments({
      taskId: assignment.taskId,
      status: { $ne: AssignmentStatus.COMPLETED },
    });

    if (remaining === 0) {
      await TaskModel.updateOne({ _id: assignment.taskId }, { $set: { status: TaskStatus.COMPLETED } });
      await delKeys([...cacheKeysForTaskMutations(input.orgIdStr, taskIdStr)]);
      await invalidateTaskListsForOrg(input.orgIdStr);

      const t2 = await TaskModel.findById(assignment.taskId).select('assignedTo orgId groupId').lean();
      const userIds = ((t2?.assignedTo as any[]) ?? []).map(String);
      await publishEvent({
        type: 'task.completed',
        orgId: input.orgIdStr,
        groupId: (t2 as any)?.groupId ? String((t2 as any).groupId) : null,
        taskId: taskIdStr,
        userIds,
      });
    }
  }
}
