import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/auth/useAuth';
import { apiFetch } from '@/lib/apiClient';
import type { Assignment, Task } from '@/hooks/types';

export function useTask(taskId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['tasks', 'detail', taskId],
    enabled: !!token && !!taskId,
    queryFn: async () => {
      const res = await apiFetch<{ task: Task; assignments: Assignment[] }>(`/tasks/${taskId}`, {
        method: 'GET',
        token,
      });
      return res;
    },
  });
}

