import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';

export function AppIndexRedirect() {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (hasRole('owner', 'admin', 'manager')) return <Navigate to="/app/dashboard" replace />;
  return <Navigate to="/app/my-tasks" replace />;
}
