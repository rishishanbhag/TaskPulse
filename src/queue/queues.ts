import { Queue } from 'bullmq';

import { redis } from '@/config/redis.js';

export const taskQueue = new Queue('tasks', {
  connection: redis,
});

export const JOB_SEND_TASK_NOTIFICATIONS = 'send-task-notifications';

