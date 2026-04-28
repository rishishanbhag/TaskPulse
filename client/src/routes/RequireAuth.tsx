import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  }

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

