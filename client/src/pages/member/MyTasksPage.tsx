import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { useTasks } from '@/hooks/useTasks';

export function MyTasksPage() {
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useTasks();

  if (user?.role !== 'member') {
    return <div className="text-sm text-gray-600">Forbidden.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My tasks</h1>
        <p className="text-sm text-gray-500 mt-1">Your assigned tasks and their delivery status.</p>
      </div>

      {isLoading ? <div className="text-sm text-gray-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">Failed to load tasks.</div> : null}

      {tasks && tasks.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-600">
          Nothing assigned yet.
        </div>
      ) : null}

      {tasks && tasks.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
          {tasks.map((t) => (
            <Link key={t._id} to={`/app/tasks/${t._id}`} className="block px-4 py-4 hover:bg-gray-50">
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-gray-500 line-clamp-1">{t.description}</div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

