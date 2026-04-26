import { Redis } from 'ioredis';

import { env } from '@/config/env.js';

export const EVENTS_CHANNEL = 'tp:v1:events';

type BaseEvent = { type: string; ts: number; orgId: string; groupId?: string | null };

export type TaskEvent =
  | (BaseEvent & {
      type: 'assignment.updated';
      taskId: string;
      assignmentId: string;
      userId: string;
      status: string;
    })
  | (BaseEvent & {
      type: 'assignment.help_requested';
      taskId: string;
      assignmentId: string;
      userId: string;
    })
  | (BaseEvent & {
      type: 'assignment.delay_requested';
      taskId: string;
      assignmentId: string;
      userId: string;
      until?: string;
    })
  | (BaseEvent & {
      type: 'task.completed';
      taskId: string;
      userIds: string[];
    });

const pub = new Redis(env.REDIS_URL);

type WithoutTs<T> = T extends any ? Omit<T, 'ts'> : never;

export async function publishEvent(event: WithoutTs<TaskEvent>) {
  const payload: TaskEvent = { ...(event as any), ts: Date.now() } as TaskEvent;
  await pub.publish(EVENTS_CHANNEL, JSON.stringify(payload));
}

export function createEventsSubscriber() {
  const sub = new Redis(env.REDIS_URL);
  return sub;
}
