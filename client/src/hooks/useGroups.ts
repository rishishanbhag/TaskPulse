import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/auth/useAuth';
import { apiFetch } from '@/lib/apiClient';
import type { Group } from '@/hooks/types';

export function useGroups() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['groups'],
    enabled: !!token,
    queryFn: async () => {
      const res = await apiFetch<{ groups: Group[] }>('/groups', { method: 'GET', token: token! });
      return res.groups;
    },
  });
}
