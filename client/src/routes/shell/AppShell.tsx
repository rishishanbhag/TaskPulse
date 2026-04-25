import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { useTaskEvents } from '@/hooks/useTaskEvents';

export function AppShell() {
  const { user, logout } = useAuth();
  useTaskEvents();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold tracking-tight">
              TaskPulse
            </Link>
            <nav className="text-sm text-gray-600 flex items-center gap-3">
              <Link to="/app">Home</Link>
              {user?.role === 'admin' ? (
                <>
                  <Link to="/app/dashboard">Dashboard</Link>
                  <Link to="/app/admin/tasks/new">New task</Link>
                </>
              ) : (
                <Link to="/app/my-tasks">My tasks</Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{user.name}</span>{' '}
                <span className="text-gray-400">·</span> {user.role}
              </div>
            ) : null}
            <button
              onClick={logout}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

