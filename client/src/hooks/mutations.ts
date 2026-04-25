import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import type { Task } from '@/hooks/types';

export function useCreateTask() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      assignedTo: string[];
      deadline?: Date;
      scheduledAt?: Date;
    }) => {
      const res = await apiFetch<{ task: Task }>('/tasks', { method: 'POST', token, body: input });
      return res.task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
    },
  });
}

export function useApproveTask() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiFetch<{ task: Task }>(`/tasks/${taskId}/approve`, { method: 'POST', token });
      return res.task;
    },
    onSuccess: (_task, taskId) => {
      qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
      qc.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] });
    },
  });
}

export function useRescheduleTask() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { taskId: string; scheduledAt: Date }) => {
      const res = await apiFetch<{ task: Task }>(`/tasks/${input.taskId}/reschedule`, {
        method: 'POST',
        token,
        body: { scheduledAt: input.scheduledAt },
      });
      return res.task;
    },
    onSuccess: (_task, input) => {
      qc.invalidateQueries({ queryKey: ['tasks', 'list'] });
      qc.invalidateQueries({ queryKey: ['tasks', 'detail', input.taskId] });
    },
  });
}

export function useLinkPhone() {
  const { token, setSession, user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiFetch<{ user: typeof user }>('/auth/me/phone', { method: 'PATCH', token, body: { phone } });
      return res.user;
    },
    onSuccess: (u) => {
      if (u && token) setSession(token, u as any);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

