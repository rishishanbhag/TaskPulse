import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { logger } from '@/config/logger.js';
import { redis } from '@/config/redis.js';
import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';
import { MessageModel } from '@/models/Message.js';
import { TaskModel, TaskStatus } from '@/models/Task.js';
import { UserModel } from '@/models/User.js';
import { JOB_SEND_TASK_NOTIFICATIONS } from '@/queue/queues.js';
import { sendWhatsAppTaskMessage } from '@/services/twilioService.js';

function buildTaskBody(task: { title: string; description: string; deadline?: Date | null }) {
  const lines = [
    `Task: ${task.title}`,
    '',
    task.description,
    '',
    task.deadline ? `Deadline: ${task.deadline.toISOString()}` : undefined,
    `Reply DONE when finished.`,
  ].filter(Boolean) as string[];
  return lines.join('\n');
}

export function initTaskWorker() {
  const log = logger.child({ component: 'taskWorker' });
  const worker = new Worker(
    'tasks',
    async (job) => {
      if (job.name !== JOB_SEND_TASK_NOTIFICATIONS) return;

      const { taskId } = job.data as { taskId: string };

      const task = await TaskModel.findById(taskId);
      if (!task) {
        log.warn({ taskId }, 'Task not found for job');
        return;
      }

      if (task.status === TaskStatus.APPROVED) {
        task.status = TaskStatus.QUEUED;
        await task.save();
      }

      const assignments = await AssignmentModel.find({ taskId: task._id }).lean();
      const pending = assignments.filter((a) => a.status === AssignmentStatus.PENDING);

      const userIds = pending.map((a) => new mongoose.Types.ObjectId(String(a.userId)));
      const users = await UserModel.find({ _id: { $in: userIds } }).lean();
      const usersById = new Map(users.map((u) => [String(u._id), u]));

      const body = buildTaskBody(task);

      for (const assignment of pending) {
        const user = usersById.get(String(assignment.userId));
        if (!user?.phone) {
          await AssignmentModel.updateOne(
            { _id: assignment._id },
            { $set: { status: AssignmentStatus.FAILED, updatedAt: new Date() } },
          );
          continue;
        }

        try {
          const result = await sendWhatsAppTaskMessage({
            toE164: user.phone,
            body,
            taskId: String(task._id),
          });

          const msg = await MessageModel.create({
            taskId: task._id,
            userId: user._id,
            assignmentId: assignment._id,
            twilioSid: result.sid,
            status: result.status,
            body,
            attempts: (assignment as any).attempts ?? 0,
          });

          await AssignmentModel.updateOne(
            { _id: assignment._id },
            {
              $set: {
                status: AssignmentStatus.SENT,
                lastMessageId: msg._id,
                updatedAt: new Date(),
              },
            },
          );
        } catch (err) {
          log.error({ err, taskId: String(task._id), userId: String(user._id) }, 'Send failed');
          await AssignmentModel.updateOne(
            { _id: assignment._id },
            { $set: { status: AssignmentStatus.FAILED, updatedAt: new Date() } },
          );
        }
      }

      const remainingPending = await AssignmentModel.countDocuments({
        taskId: task._id,
        status: AssignmentStatus.PENDING,
      });

      if (remainingPending === 0) {
        await TaskModel.updateOne({ _id: task._id }, { $set: { status: TaskStatus.SENT } });
      }
    },
    { connection: redis },
  );

  worker.on('failed', (job, err) => {
    log.error({ err, jobId: job?.id, name: job?.name }, 'Worker job failed');
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, name: job.name }, 'Worker job completed');
  });

  return worker;
}

