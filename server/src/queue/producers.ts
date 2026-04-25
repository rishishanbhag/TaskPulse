import { taskQueue, JOB_SEND_TASK_NOTIFICATIONS } from '@/queue/queues.js';

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

export async function rescheduleSendTaskNotifications(taskId: string, opts: { delay: number }) {
  const jobId = `task:${taskId}:send`;
  const existing = await taskQueue.getJob(jobId);
  if (existing) await existing.remove();
  await enqueueSendTaskNotifications(taskId, opts);
}

