import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/auth/useAuth';
import { apiFetch } from '@/lib/apiClient';
import type { Task } from '@/hooks/types';

export function useTasks() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['tasks', 'list'],
    enabled: !!token,
    queryFn: async () => {
      const res = await apiFetch<{ tasks: Task[] }>('/tasks', { method: 'GET', token });
      return res.tasks;
    },
  });
}

