import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, Send, AlertTriangle } from 'lucide-react';

import { useAuth } from '@/auth/AuthProvider';
import { useTasks } from '@/hooks/useTasks';

function pill(status: string) {
  const base = 'text-xs font-semibold px-2.5 py-1 rounded-full';
  if (status === 'COMPLETED') return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`;
  if (status === 'SENT') return `${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`;
  if (status === 'QUEUED') return `${base} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`;
  if (status === 'APPROVED') return `${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`;
  if (status === 'DRAFT') return `${base} bg-gray-100 text-gray-600 ring-1 ring-gray-200`;
  return `${base} bg-gray-100 text-gray-600 ring-1 ring-gray-200`;
}

function priorityDot(priority?: string) {
  const p = (priority ?? 'MEDIUM').toUpperCase();
  if (p === 'URGENT') return 'bg-red-500';
  if (p === 'HIGH') return 'bg-amber-500';
  if (p === 'LOW') return 'bg-gray-300';
  return 'bg-blue-400';
}

export function AdminDashboardPage() {
  const { hasRole } = useAuth();
  const { data: tasks, isLoading, error } = useTasks();

  if (!hasRole('owner', 'admin', 'manager')) {
    return <div className="text-sm text-gray-600">Forbidden.</div>;
  }

  const total = tasks?.length ?? 0;
  const completed = tasks?.filter(t => t.status === 'COMPLETED').length ?? 0;
  const sent = tasks?.filter(t => t.status === 'SENT').length ?? 0;
  const drafts = tasks?.filter(t => t.status === 'DRAFT').length ?? 0;

  const stats = [
    { label: 'Total Tasks', value: total, icon: Clock, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'Sent', value: sent, icon: Send, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Drafts', value: drafts, icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Draft, approve, and track WhatsApp delivery.</p>
        </div>
        <Link
          to="/app/admin/tasks/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New task
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-xs">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-gray-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">Failed to load tasks.</div> : null}

      {tasks && tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-3">
            <Clock className="w-10 h-10 mx-auto" />
          </div>
          <div className="text-lg font-semibold text-gray-700">No tasks yet</div>
          <p className="text-sm text-gray-500 mt-1">Create your first task to get started.</p>
          <Link
            to="/app/admin/tasks/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create task
          </Link>
        </div>
      ) : null}

      {tasks && tasks.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Assignees</div>
            <div className="col-span-2 text-right">Deadline</div>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.map((t) => (
              <Link
                key={t._id}
                to={`/app/tasks/${t._id}`}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group"
              >
                <div className="col-span-5">
                  <div className="font-semibold text-gray-900 flex items-center gap-2 group-hover:text-black">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot((t as any).priority)}`} />
                    <span>{t.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-1 ml-4">{t.description}</div>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={pill(t.status)}>{t.status}</span>
                </div>
                <div className="col-span-3 flex items-center text-sm text-gray-600">
                  <span className="font-medium">{t.assignedTo?.length ?? 0}</span>
                  <span className="ml-1 text-gray-400">member{(t.assignedTo?.length ?? 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="col-span-2 text-right text-sm text-gray-500 flex items-center justify-end">
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
