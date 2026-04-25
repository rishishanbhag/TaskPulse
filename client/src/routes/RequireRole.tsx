import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';

export function RequireRole({
  role,
  children,
}: {
  role: 'admin' | 'member';
  children: React.ReactNode;
}) {
  const { user, bootstrapped } = useAuth();
  if (!bootstrapped) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

