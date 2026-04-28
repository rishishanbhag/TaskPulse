import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ListTodo, PlusCircle, Settings, LogOut } from 'lucide-react';

import { useAuth } from '@/auth/useAuth';
import { useTaskEvents } from '@/hooks/useTaskEvents';

export function AppShell() {
  const { user, logout, hasRole } = useAuth();
  useTaskEvents();

  const showStaff = hasRole('owner', 'admin', 'manager');

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-900 text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-[rgb(250,250,250)] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold tracking-tight text-lg">
              TaskPulse
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink to="/app/my-tasks" className={linkClass}>
                <ListTodo className="w-4 h-4" />
                My Tasks
              </NavLink>
              {showStaff ? (
                <>
                  <NavLink to="/app/dashboard" className={linkClass}>
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/app/admin/tasks/new" className={linkClass}>
                    <PlusCircle className="w-4 h-4" />
                    New Task
                  </NavLink>
                </>
              ) : null}
              {hasRole('owner', 'admin', 'manager') ? (
                <NavLink to="/app/settings" className={linkClass}>
                  <Settings className="w-4 h-4" />
                  Settings
                </NavLink>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="hidden sm:block text-sm">
                  <div className="font-semibold text-gray-900 leading-tight">{user.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                </div>
              </div>
            ) : null}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
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
