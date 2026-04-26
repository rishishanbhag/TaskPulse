import type { RequestHandler } from 'express';
import mongoose from 'mongoose';

import { GroupModel } from '@/models/Group.js';
import { UserRole } from '@/models/User.js';
import { createEventsSubscriber, EVENTS_CHANNEL, type TaskEvent } from '@/services/events.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

function sseWrite(res: any, event: TaskEvent) {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export const streamController = {
  tasks: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });

    let managerGroupIds: Set<string> | null = null;
    if (req.user.role === UserRole.MANAGER) {
      const groups = await GroupModel.find({
        orgId: req.user.orgId,
        members: new mongoose.Types.ObjectId(req.user.id),
      })
        .select('_id')
        .lean();
      managerGroupIds = new Set(groups.map((g) => String(g._id)));
    }

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

      if ((event as any).orgId && (event as any).orgId !== req.user?.orgId) return;

      if (req.user?.role === UserRole.OWNER || req.user?.role === UserRole.ADMIN) {
        sseWrite(res, event);
        return;
      }

      if (req.user?.role === UserRole.MANAGER) {
        if (!managerGroupIds) return;
        const gid = (event as any).groupId ? String((event as any).groupId) : null;
        if (!gid || !managerGroupIds.has(gid)) return;
        sseWrite(res, event);
        return;
      }

      if (event.type === 'assignment.updated' || event.type === 'assignment.help_requested' || event.type === 'assignment.delay_requested') {
        if (event.userId !== req.user?.id) return;
        sseWrite(res, event);
        return;
      }

      if (event.type === 'task.completed') {
        if (!req.user?.id) return;
        if (!event.userIds.includes(req.user.id)) return;
        sseWrite(res, event);
        return;
      }
    });
  }) as RequestHandler,
};
