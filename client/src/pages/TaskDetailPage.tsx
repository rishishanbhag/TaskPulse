import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { useApproveTask, useRescheduleTask } from '@/hooks/mutations';
import { useTask } from '@/hooks/useTask';

function statusBadge(status: string) {
  const base = 'text-xs font-semibold px-2 py-1 rounded-full border';
  if (status === 'COMPLETED') return `${base} border-green-200 bg-green-50 text-green-700`;
  if (status === 'SENT') return `${base} border-blue-200 bg-blue-50 text-blue-700`;
  if (status === 'DELIVERED') return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  if (status === 'FAILED') return `${base} border-red-200 bg-red-50 text-red-700`;
  return `${base} border-gray-200 bg-gray-50 text-gray-700`;
}

export function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const taskId = id ?? '';
  const { data, isLoading, error } = useTask(taskId);
  const approve = useApproveTask();
  const reschedule = useRescheduleTask();
  const [scheduledAt, setScheduledAt] = useState('');

  const task = data?.task;
  const assignments = data?.assignments ?? [];

  const canAdmin = user?.role === 'admin';

  const assignmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
    return counts;
  }, [assignments]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{task?.title ?? 'Task'}</h1>
          <div className="text-sm text-gray-500 mt-2 flex items-center gap-2 flex-wrap">
            {task ? <span className={statusBadge(task.status)}>{task.status}</span> : null}
            {task?.priority ? <span className="text-xs font-semibold px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">{task.priority}</span> : null}
            {task?.deadline ? <span>Deadline: {new Date(task.deadline).toLocaleString()}</span> : null}
            {task?.scheduledAt ? <span>Scheduled: {new Date(task.scheduledAt).toLocaleString()}</span> : null}
          </div>
        </div>
        <Link to={user?.role === 'admin' ? '/app/dashboard' : '/app/my-tasks'} className="text-sm px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">
          Back
        </Link>
      </div>

      {isLoading ? <div className="text-sm text-gray-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">Failed to load task.</div> : null}

      {task ? (
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</div>

          <div className="flex flex-wrap gap-2">
            {Array.from(assignmentCounts.entries()).map(([s, n]) => (
              <span key={s} className={statusBadge(s)}>
                {s}: {n}
              </span>
            ))}
          </div>

          {canAdmin ? (
            <div className="pt-2 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reschedule send</label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <button
                    disabled={!scheduledAt || reschedule.isPending}
                    onClick={async () => {
                      if (!scheduledAt) return;
                      await reschedule.mutateAsync({ taskId: task._id, scheduledAt: new Date(scheduledAt) });
                    }}
                    className="px-4 py-2 rounded-md border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                  >
                    {reschedule.isPending ? 'Saving…' : 'Reschedule'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={task.status !== 'DRAFT' || approve.isPending}
                  onClick={async () => {
                    await approve.mutateAsync(task._id);
                  }}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm font-semibold disabled:opacity-60"
                >
                  {approve.isPending ? 'Approving…' : 'Approve'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500">
          <div className="col-span-4">Assignment</div>
          <div className="col-span-3">User</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2">Signals</div>
          <div className="col-span-2 text-right">Updated</div>
        </div>
        <div className="divide-y divide-gray-200">
          {assignments.map((a) => (
            <div key={a._id} className="grid grid-cols-12 gap-4 px-4 py-4">
              <div className="col-span-4 font-mono text-xs text-gray-600">{a._id}</div>
              <div className="col-span-3 font-mono text-xs text-gray-600">{a.userId}</div>
              <div className="col-span-3">
                <span className={statusBadge(a.status)}>{a.status}</span>
              </div>
              <div className="col-span-2 text-xs text-gray-600">
                {a.lastReplyType === 'HELP' ? (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700">
                    HELP
                  </span>
                ) : a.lastReplyType === 'DELAY' ? (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                    DELAY
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
              <div className="col-span-2 text-right text-xs text-gray-500">
                {a.updatedAt ? new Date(a.updatedAt).toLocaleString() : '—'}
              </div>
            </div>
          ))}
          {assignments.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-600">No assignments.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

