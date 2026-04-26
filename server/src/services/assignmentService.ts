import mongoose from 'mongoose';

import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';
import { cached } from '@/services/cache.js';

const TTL_ASSIGNMENTS_SECONDS = 30;
function keyTaskAssignmentsCache(taskId: string) {
  return `tp:v1:task:${taskId}:assignments`;
}

export async function upsertAssignmentsForTask(
  orgId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  userIds: string[],
) {
  const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);
  const ops = userIds.map((userId) => ({
    updateOne: {
      filter: { taskId, userId: toObjectId(userId) },
      update: {
        $set: { orgId, updatedAt: new Date() },
        $setOnInsert: {
          taskId,
          userId: toObjectId(userId),
          status: AssignmentStatus.PENDING,
        },
      },
      upsert: true,
    },
  }));

  if (ops.length === 0) return;
  await AssignmentModel.bulkWrite(ops);
}

export async function listAssignmentsForTask(orgId: string, taskId: string) {
  return cached(keyTaskAssignmentsCache(taskId), TTL_ASSIGNMENTS_SECONDS, async () => {
    return AssignmentModel.find({ orgId, taskId }).lean();
  });
}

export async function findLatestOpenAssignmentForUser(userId: string, orgId: string) {
  return AssignmentModel.findOne({
    orgId: new mongoose.Types.ObjectId(orgId),
    userId: new mongoose.Types.ObjectId(userId),
    status: { $in: [AssignmentStatus.SENT, AssignmentStatus.DELIVERED, AssignmentStatus.PENDING, AssignmentStatus.FAILED] },
  })
    .sort({ updatedAt: -1 })
    .lean();
}
