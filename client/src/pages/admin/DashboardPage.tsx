import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { useTasks } from '@/hooks/useTasks';

function pill(status: string) {
  const base = 'text-xs font-semibold px-2 py-1 rounded-full border';
  if (status === 'COMPLETED') return `${base} border-green-200 bg-green-50 text-green-700`;
  if (status === 'SENT') return `${base} border-blue-200 bg-blue-50 text-blue-700`;
  if (status === 'QUEUED') return `${base} border-indigo-200 bg-indigo-50 text-indigo-700`;
  if (status === 'APPROVED') return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  return `${base} border-gray-200 bg-gray-50 text-gray-700`;
}

function priorityPill(priority?: string) {
  const base = 'text-[10px] font-semibold px-2 py-1 rounded-full border';
  const p = (priority ?? 'MEDIUM').toUpperCase();
  if (p === 'URGENT') return `${base} border-red-200 bg-red-50 text-red-700`;
  if (p === 'HIGH') return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  if (p === 'LOW') return `${base} border-gray-200 bg-gray-50 text-gray-600`;
  return `${base} border-blue-200 bg-blue-50 text-blue-700`;
}

export function AdminDashboardPage() {
  const { hasRole } = useAuth();
  const { data: tasks, isLoading, error } = useTasks();

  if (!hasRole('owner', 'admin', 'manager')) {
    return <div className="text-sm text-gray-600">Forbidden.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Draft, approve, and track WhatsApp delivery.</p>
        </div>
        <Link
          to="/app/admin/tasks/new"
          className="px-4 py-2 rounded-md bg-black text-white text-sm font-semibold hover:opacity-95"
        >
          New task
        </Link>
      </div>

      {isLoading ? <div className="text-sm text-gray-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">Failed to load tasks.</div> : null}

      {tasks && tasks.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-600">
          No tasks yet. Create your first one.
        </div>
      ) : null}

      {tasks && tasks.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Assignees</div>
            <div className="col-span-2 text-right">Open</div>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.map((t) => (
              <Link
                key={t._id}
                to={`/app/tasks/${t._id}`}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50"
              >
                <div className="col-span-5">
                  <div className="font-medium flex items-center gap-2">
                    <span>{t.title}</span>
                    <span className={priorityPill((t as any).priority)}>{((t as any).priority ?? 'MEDIUM').toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">{t.description}</div>
                </div>
                <div className="col-span-2">
                  <span className={pill(t.status)}>{t.status}</span>
                </div>
                <div className="col-span-3 text-sm text-gray-600">{t.assignedTo?.length ?? 0}</div>
                <div className="col-span-2 text-right text-sm text-gray-600">
                  {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

