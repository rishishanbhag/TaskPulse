import type { RequestHandler } from 'express';

import { createEventsSubscriber, EVENTS_CHANNEL, type TaskEvent } from '@/services/events.js';

function sseWrite(res: any, event: TaskEvent) {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export const streamController = {
  tasks: ((): RequestHandler => {
    return async (req, res) => {
      if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });

      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      (res as any).flushHeaders?.();

      const sub = createEventsSubscriber();
      let closed = false;

      const heartbeat = setInterval(() => {
        res.write(`event: heartbeat\n`);
        res.write(`data: ${Date.now()}\n\n`);
      }, 15_000);

      const close = async () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        try {
          await sub.unsubscribe(EVENTS_CHANNEL);
        } catch {
          // ignore
        }
        try {
          sub.disconnect();
        } catch {
          // ignore
        }
        res.end();
      };

      req.on('close', close);
      req.on('aborted', close);

      await sub.subscribe(EVENTS_CHANNEL);
      sub.on('message', (_channel, message) => {
        if (closed) return;

        let event: TaskEvent | null = null;
        try {
          event = JSON.parse(message) as TaskEvent;
        } catch {
          return;
        }

        if (req.user?.role === 'admin') {
          sseWrite(res, event);
          return;
        }

        // member filtering
        if (event.type === 'assignment.updated') {
          if (event.userId !== req.user?.id) return;
          sseWrite(res, event);
          return;
        }

        if (event.type === 'task.completed') {
          if (!event.userIds.includes(req.user?.id)) return;
          sseWrite(res, event);
          return;
        }
      });
    };
  })(),
};

