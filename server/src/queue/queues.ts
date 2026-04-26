import { Queue } from 'bullmq';

import { redis } from '@/config/redis.js';

export const taskQueue = new Queue('tasks', {
  connection: redis,
});

export const JOB_SEND_TASK_NOTIFICATIONS = 'send-task-notifications';
export const JOB_SEND_ASSIGNMENT_MESSAGE = 'send-assignment-message';
export const JOB_SEND_DEADLINE_REMINDER = 'send-deadline-reminder';

