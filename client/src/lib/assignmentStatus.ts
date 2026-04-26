import type { AssignmentStatus } from '@/hooks/types';

const open: AssignmentStatus[] = ['PENDING', 'SENT', 'DELIVERED'];

export function isAssignmentActionableStatus(status: string) {
  return (open as readonly string[]).includes(status);
}
