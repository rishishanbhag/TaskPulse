import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import type { User } from '@/hooks/types';

/**
 * Picker for "assign to" on create task.
 * - Managers: must pick among users already in the selected group's members[].
 * - Owners/admins: list org `member`-role users even when a group is selected; the server adds assignees
 *   to the group when the task is created (org members ≠ group members until then).
 */
export function useMembers(q?: string, groupId?: string) {
  const { token, hasRole } = useAuth();
  const canList = hasRole('owner', 'admin', 'manager');
  const groupForQuery = hasRole('manager') ? (groupId?.trim() || undefined) : undefined;
  return useQuery({
    queryKey: ['users', 'members', q ?? '', groupForQuery ?? ''],
    enabled: !!token && canList,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (!groupForQuery) qs.set('role', 'member');
      if (q?.trim()) qs.set('q', q.trim());
      if (groupForQuery) qs.set('groupId', groupForQuery);
      const res = await apiFetch<{ users: User[] }>(`/users?${qs.toString()}`, { method: 'GET', token: token! });
      return res.users;
    },
  });
}
