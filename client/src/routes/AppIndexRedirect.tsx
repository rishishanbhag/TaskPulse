import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';

export function AppIndexRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/app/dashboard' : '/app/my-tasks'} replace />;
}

