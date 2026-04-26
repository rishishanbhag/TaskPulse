import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { logger } from '@/config/logger.js';
import { redis } from '@/config/redis.js';
import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';
import { MessageModel } from '@/models/Message.js';
import { TaskModel, TaskStatus } from '@/models/Task.js';
import { UserModel } from '@/models/User.js';
import { JOB_SEND_ASSIGNMENT_MESSAGE, JOB_SEND_DEADLINE_REMINDER, JOB_SEND_TASK_NOTIFICATIONS } from '@/queue/queues.js';
import { enqueueSendAssignmentMessage } from '@/queue/producers.js';
import { delKeys } from '@/services/cache.js';
import { publishEvent } from '@/services/events.js';
import { sendWhatsAppTaskMessage } from '@/services/twilioService.js';

function buildTaskBody(task: { title: string; description: string; deadline?: Date | null; priority?: string | null }) {
  const lines = [
    task.priority && task.priority.toUpperCase() === 'URGENT' ? `[URGENT]` : undefined,
    `Task: ${task.title}`,
    task.priority ? `Priority: ${task.priority}` : undefined,
    '',
    task.description,
    '',
    task.deadline ? `Deadline: ${task.deadline.toISOString()}` : undefined,
    `Reply DONE when finished.`,
  ].filter(Boolean) as string[];
  return lines.join('\n');
}

function buildReminderBody(input: { title: string; window: '24h' | '1h' }) {
  const label = input.window === '24h' ? '24 hours' : '1 hour';
  return `Reminder: "${input.title}" is due in ${label}.\nReply DONE when finished.`;
}

async function invalidateTaskAndAssignmentCaches(taskId: string, userId: string) {
  await delKeys([
    `tp:v1:task:${taskId}:assignments`,
    `tp:v1:task:${taskId}:detail`,
    'tp:v1:tasks:list:admin',
    `tp:v1:tasks:list:user:${userId}`,
  ]);
}

async function publishAssignmentUpdated(input: { taskId: string; assignmentId: string; userId: string; status: string }) {
  await publishEvent({
    type: 'assignment.updated',
    taskId: input.taskId,
    assignmentId: input.assignmentId,
    userId: input.userId,
    status: input.status,
  });
}

async function maybeMarkTaskSent(taskId: string) {
  const remainingPending = await AssignmentModel.countDocuments({
    taskId,
    status: AssignmentStatus.PENDING,
  });

  if (remainingPending === 0) {
    await TaskModel.updateOne({ _id: taskId }, { $set: { status: TaskStatus.SENT } });
    await delKeys([`tp:v1:task:${taskId}:detail`, 'tp:v1:tasks:list:admin']);
  }
}

export function initTaskWorker() {
  const log = logger.child({ component: 'taskWorker' });
  const worker = new Worker(
    'tasks',
    async (job) => {
      if (
        job.name !== JOB_SEND_TASK_NOTIFICATIONS &&
        job.name !== JOB_SEND_ASSIGNMENT_MESSAGE &&
        job.name !== JOB_SEND_DEADLINE_REMINDER
      )
        return;

      if (job.name === JOB_SEND_TASK_NOTIFICATIONS) {
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

        // Fan out per-assignment jobs. Retry semantics now live at the per-recipient level.
        for (const assignment of pending) {
          await enqueueSendAssignmentMessage(String(assignment._id));
        }

        // Task may already be trivially send-complete (e.g. no assignments), keep behavior consistent.
        await maybeMarkTaskSent(String(task._id));
        return;
      }

      if (job.name === JOB_SEND_DEADLINE_REMINDER) {
        const { taskId, window } = job.data as { taskId: string; window: '24h' | '1h' };

        const task = await TaskModel.findById(taskId);
        if (!task) {
          log.warn({ taskId, window }, 'Task not found for reminder job');
          return;
        }

        const incomplete = await AssignmentModel.find({
          taskId: task._id,
          status: { $ne: AssignmentStatus.COMPLETED },
        }).lean();

        const userIds = incomplete.map((a) => new mongoose.Types.ObjectId(String(a.userId)));
        const users = await UserModel.find({ _id: { $in: userIds } }).select('_id phone').lean();
        const usersById = new Map(users.map((u) => [String(u._id), u]));

        const body = buildReminderBody({ title: task.title, window });

        for (const a of incomplete) {
          const u = usersById.get(String(a.userId));
          if (!u?.phone) continue;
          try {
            await sendWhatsAppTaskMessage({ toE164: u.phone, body, taskId: String(task._id) });
          } catch (err) {
            // Reminder retries are handled at the job level; rethrow to allow BullMQ attempts/backoff.
            log.error({ err, taskId: String(task._id), window, userId: String(a.userId) }, 'Reminder send failed');
            throw err;
          }
        }

        return;
      }

      // Per-assignment sender with real BullMQ retry behavior.
      const { assignmentId } = job.data as { assignmentId: string };
      const assignment = await AssignmentModel.findById(assignmentId);
      if (!assignment) {
        log.warn({ assignmentId }, 'Assignment not found for job');
        return;
      }

      // Only send for assignments still pending.
      if (assignment.status !== AssignmentStatus.PENDING) return;

      const task = await TaskModel.findById(assignment.taskId);
      if (!task) {
        log.warn({ assignmentId, taskId: String(assignment.taskId) }, 'Task not found for assignment send');
        return;
      }

      const user = await UserModel.findById(assignment.userId);
      if (!user?.phone) {
        const taskIdStr = String(task._id);
        const userIdStr = String(assignment.userId);
        await AssignmentModel.updateOne(
          { _id: assignment._id },
          { $set: { status: AssignmentStatus.FAILED, updatedAt: new Date() } },
        );
        await invalidateTaskAndAssignmentCaches(taskIdStr, userIdStr);
        await publishAssignmentUpdated({
          taskId: taskIdStr,
          assignmentId: String(assignment._id),
          userId: userIdStr,
          status: AssignmentStatus.FAILED,
        });
        await maybeMarkTaskSent(taskIdStr);
        return;
      }

      const body = buildTaskBody(task);
      const taskIdStr = String(task._id);
      const userIdStr = String(user._id);

      try {
        const result = await sendWhatsAppTaskMessage({
          toE164: user.phone,
          body,
          taskId: taskIdStr,
        });

        const attempt = job.attemptsMade + 1;
        const msg = await MessageModel.create({
          taskId: task._id,
          userId: user._id,
          assignmentId: assignment._id,
          dedupeKey: `assignment:${String(assignment._id)}:attempt:${attempt}`,
          twilioSid: result.sid,
          status: result.status,
          body,
          attempts: attempt,
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

        await invalidateTaskAndAssignmentCaches(taskIdStr, userIdStr);
        await publishAssignmentUpdated({
          taskId: taskIdStr,
          assignmentId: String(assignment._id),
          userId: userIdStr,
          status: AssignmentStatus.SENT,
        });

        await maybeMarkTaskSent(taskIdStr);
        return;
      } catch (err) {
        const isFinalAttempt = (job.attemptsMade + 1) >= (job.opts.attempts ?? 1);
        log.error(
          { err, assignmentId: String(assignment._id), taskId: taskIdStr, userId: userIdStr, isFinalAttempt },
          'Send failed',
        );

        if (isFinalAttempt) {
          await AssignmentModel.updateOne(
            { _id: assignment._id },
            { $set: { status: AssignmentStatus.FAILED, updatedAt: new Date() } },
          );
          await invalidateTaskAndAssignmentCaches(taskIdStr, userIdStr);
          await publishAssignmentUpdated({
            taskId: taskIdStr,
            assignmentId: String(assignment._id),
            userId: userIdStr,
            status: AssignmentStatus.FAILED,
          });
          await maybeMarkTaskSent(taskIdStr);
        }

        // Re-throw so BullMQ retries (unless this was final attempt).
        throw err;
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

