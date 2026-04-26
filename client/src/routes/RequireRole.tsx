import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import type { UserRole } from '@/hooks/types';

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, bootstrapped } = useAuth();
  if (!bootstrapped) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
