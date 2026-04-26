import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import {
  useAssignmentMarkDone,
  useAssignmentRequestDelay,
  useAssignmentRequestHelp,
} from '@/hooks/mutations';
import type { Task } from '@/hooks/types';
import { useTasks } from '@/hooks/useTasks';
import { isAssignmentActionableStatus } from '@/lib/assignmentStatus';

function taskRowActions(task: Task) {
  const a = task.myAssignment;
  if (!a || !isAssignmentActionableStatus(a.status)) return null;
  return { assignmentId: a._id, taskId: task._id };
}

export function MyTasksPage() {
  const { data: tasks, isLoading, error } = useTasks();
  const markDone = useAssignmentMarkDone();
  const requestHelp = useAssignmentRequestHelp();
  const requestDelay = useAssignmentRequestDelay();
  const { hasRole } = useAuth();

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
          {tasks.map((t) => {
            const actions = hasRole('member') ? taskRowActions(t) : null;
            return (
              <div key={t._id} className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
                <Link to={`/app/tasks/${t._id}`} className="block flex-1 min-w-0 px-4 py-4 hover:bg-gray-50 sm:pr-2">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                    {t.shortCode ? <span className="font-mono">{t.shortCode}</span> : null}
                    <span className="line-clamp-1">{t.description}</span>
                  </div>
                </Link>
                {actions ? (
                  <div className="flex flex-wrap items-center gap-1 px-4 pb-4 sm:pb-0 sm:pr-4 sm:pl-0 sm:min-w-0 sm:justify-end sm:border-l sm:border-gray-100">
                    <button
                      type="button"
                      disabled={markDone.isPending}
                      onClick={() => markDone.mutate({ assignmentId: actions.assignmentId, taskId: actions.taskId })}
                      className="px-2.5 py-1 rounded-md bg-black text-white text-xs font-semibold disabled:opacity-60"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      disabled={requestHelp.isPending}
                      onClick={() => {
                        const note = window.prompt('Optional note for help request')?.trim() || undefined;
                        requestHelp.mutate({ assignmentId: actions.assignmentId, taskId: actions.taskId, note });
                      }}
                      className="px-2.5 py-1 rounded-md border border-purple-200 bg-purple-50 text-purple-900 text-xs font-semibold disabled:opacity-60"
                    >
                      Help
                    </button>
                    <button
                      type="button"
                      disabled={requestDelay.isPending}
                      onClick={() => {
                        const raw = window.prompt('Delay until? Enter date/time (e.g. 2026-12-01T14:00) or leave empty.');
                        if (raw === null) return;
                        const trimmed = raw.trim();
                        if (!trimmed) {
                          requestDelay.mutate({ assignmentId: actions.assignmentId, taskId: actions.taskId });
                          return;
                        }
                        const until = new Date(trimmed);
                        if (Number.isNaN(until.getTime())) {
                          // eslint-disable-next-line no-alert
                          alert('Could not parse that date.');
                          return;
                        }
                        requestDelay.mutate({ assignmentId: actions.assignmentId, taskId: actions.taskId, until });
                      }}
                      className="px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold disabled:opacity-60"
                    >
                      Delay
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
