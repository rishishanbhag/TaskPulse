import { Redis } from 'ioredis';

import { env } from '@/config/env.js';

export const EVENTS_CHANNEL = 'tp:v1:events';

type BaseEvent = { type: string; ts: number };

export type TaskEvent =
  | (BaseEvent & {
      type: 'assignment.updated';
      taskId: string;
      assignmentId: string;
      userId: string;
      status: string;
    })
  | (BaseEvent & {
      type: 'task.completed';
      taskId: string;
      userIds: string[];
    });

const pub = new Redis(env.REDIS_URL);

export async function publishEvent(event: Omit<TaskEvent, 'ts'>) {
  const payload: TaskEvent = { ...(event as any), ts: Date.now() };
  await pub.publish(EVENTS_CHANNEL, JSON.stringify(payload));
}

export function createEventsSubscriber() {
  const sub = new Redis(env.REDIS_URL);
  return sub;
}

