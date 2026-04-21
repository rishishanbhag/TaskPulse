import mongoose from 'mongoose';

import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';

export async function upsertAssignmentsForTask(taskId: mongoose.Types.ObjectId, userIds: string[]) {
  const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);
  const ops = userIds.map((userId) => ({
    updateOne: {
      filter: { taskId, userId: toObjectId(userId) },
      update: {
        $setOnInsert: {
          taskId,
          userId: toObjectId(userId),
          status: AssignmentStatus.PENDING,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (ops.length === 0) return;
  await AssignmentModel.bulkWrite(ops);
}

export async function listAssignmentsForTask(taskId: string) {
  return AssignmentModel.find({ taskId }).lean();
}

export async function findLatestOpenAssignmentForUser(userId: string) {
  return AssignmentModel.findOne({
    userId,
    status: { $in: [AssignmentStatus.SENT, AssignmentStatus.DELIVERED, AssignmentStatus.PENDING, AssignmentStatus.FAILED] },
  })
    .sort({ updatedAt: -1 })
    .lean();
}

