import {
  taskQueue,
  JOB_SEND_ASSIGNMENT_MESSAGE,
  JOB_SEND_DEADLINE_REMINDER,
  JOB_SEND_TASK_NOTIFICATIONS,
} from '@/queue/queues.js';

export async function enqueueSendTaskNotifications(taskId: string, opts?: { delay?: number }) {
  const jobId = `task:${taskId}:send`;

  await taskQueue.add(
    JOB_SEND_TASK_NOTIFICATIONS,
    { taskId },
    {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      delay: opts?.delay,
      removeOnComplete: true,
      removeOnFail: 500,
    },
  );
}

export async function enqueueSendAssignmentMessage(assignmentId: string, opts?: { delay?: number }) {
  const jobId = `assignment:${assignmentId}:send`;

  await taskQueue.add(
    JOB_SEND_ASSIGNMENT_MESSAGE,
    { assignmentId },
    {
      jobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      delay: opts?.delay,
      removeOnComplete: true,
      removeOnFail: 500,
    },
  );
}

export async function rescheduleSendTaskNotifications(taskId: string, opts: { delay: number }) {
  const jobId = `task:${taskId}:send`;
  const existing = await taskQueue.getJob(jobId);
  if (existing) await existing.remove();
  await enqueueSendTaskNotifications(taskId, opts);
}

async function upsertDeadlineReminderJob(input: { taskId: string; window: '24h' | '1h'; delay: number }) {
  const jobId = `task:${input.taskId}:reminder:${input.window}`;
  const existing = await taskQueue.getJob(jobId);
  if (existing) await existing.remove();
  await taskQueue.add(
    JOB_SEND_DEADLINE_REMINDER,
    { taskId: input.taskId, window: input.window },
    {
      jobId,
      delay: input.delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 500,
    },
  );
}

export async function enqueueDeadlineReminders(taskId: string, deadline: Date) {
  const now = Date.now();
  const deadlineMs = deadline.getTime();
  const ms24h = 24 * 60 * 60 * 1000;
  const ms1h = 60 * 60 * 1000;

  const delay24h = deadlineMs - now - ms24h;
  const delay1h = deadlineMs - now - ms1h;

  if (delay24h > 0) await upsertDeadlineReminderJob({ taskId, window: '24h', delay: delay24h });
  if (delay1h > 0) await upsertDeadlineReminderJob({ taskId, window: '1h', delay: delay1h });
}

export async function removeDeadlineReminders(taskId: string) {
  const ids = [`task:${taskId}:reminder:24h`, `task:${taskId}:reminder:1h`];
  for (const id of ids) {
    const job = await taskQueue.getJob(id);
    if (job) await job.remove();
  }
}

