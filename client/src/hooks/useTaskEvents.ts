import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { env } from '@/config/env';

type AssignmentUpdatedEvent = {
  type: 'assignment.updated';
  ts: number;
  taskId: string;
  assignmentId: string;
  userId: string;
  status: string;
};

type TaskCompletedEvent = {
  type: 'task.completed';
  ts: number;
  taskId: string;
  userIds: string[];
};

type AssignmentHelpRequestedEvent = {
  type: 'assignment.help_requested';
  ts: number;
  taskId: string;
  assignmentId: string;
  userId: string;
};

type AssignmentDelayRequestedEvent = {
  type: 'assignment.delay_requested';
  ts: number;
  taskId: string;
  assignmentId: string;
  userId: string;
  until?: string;
};

export function useTaskEvents() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const backoffRef = useRef(500);

  useEffect(() => {
    if (!token) return;

    let closed = false;
    let es: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      const url = `${env.VITE_API_BASE_URL}/stream/tasks?token=${encodeURIComponent(token)}`;
      es = new EventSource(url);

      es.addEventListener('assignment.updated', (ev) => {
        const e = JSON.parse((ev as MessageEvent).data) as AssignmentUpdatedEvent;
        qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
        qc.invalidateQueries({ queryKey: ['tasks', 'detail', e.taskId] });
      });

      es.addEventListener('task.completed', (ev) => {
        const e = JSON.parse((ev as MessageEvent).data) as TaskCompletedEvent;
        qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
        qc.invalidateQueries({ queryKey: ['tasks', 'detail', e.taskId] });
      });

      es.addEventListener('assignment.help_requested', (ev) => {
        const e = JSON.parse((ev as MessageEvent).data) as AssignmentHelpRequestedEvent;
        qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
        qc.invalidateQueries({ queryKey: ['tasks', 'detail', e.taskId] });
      });

      es.addEventListener('assignment.delay_requested', (ev) => {
        const e = JSON.parse((ev as MessageEvent).data) as AssignmentDelayRequestedEvent;
        qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
        qc.invalidateQueries({ queryKey: ['tasks', 'detail', e.taskId] });
      });

      es.addEventListener('error', () => {
        if (closed) return;
        try {
          es?.close();
        } catch {
          // ignore
        }
        es = null;

        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, 10_000);
        reconnectTimer = window.setTimeout(connect, delay);
      });
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      try {
        es?.close();
      } catch {
        // ignore
      }
    };
  }, [qc, token]);
}

