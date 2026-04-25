import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import type { User } from '@/hooks/types';

export function useMembers(q?: string) {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ['users', 'members', q ?? ''],
    enabled: !!token && user?.role === 'admin',
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set('role', 'member');
      if (q?.trim()) qs.set('q', q.trim());
      const res = await apiFetch<{ users: User[] }>(`/users?${qs.toString()}`, { method: 'GET', token });
      return res.users;
    },
  });
}

