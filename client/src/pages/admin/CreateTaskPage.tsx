import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { useMembers } from '@/hooks/useMembers';
import { useApproveTask, useCreateTask } from '@/hooks/mutations';
import { apiFetch } from '@/lib/apiClient';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  assignedTo: z.array(z.string().min(1)).min(1, 'Pick at least one member'),
  priority: priorityEnum,
  deadline: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateTaskPage() {
  const { user, token } = useAuth();
  const [search, setSearch] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ _id: string; name: string }[]>([]);
  const membersQuery = useMembers(search);
  const create = useCreateTask();
  const approve = useApproveTask();

  const members = membersQuery.data ?? [];
  const options = useMemo(
    () => members.map((m) => ({ id: m.id, label: `${m.name} (${m.email})` })),
    [members],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', assignedTo: [], priority: 'MEDIUM' },
  });

  useEffect(() => {
    if (!token) return;
    apiFetch<{ templates: { _id: string; name: string }[] }>('/templates', { method: 'GET', token })
      .then((res) => setTemplates(res.templates ?? []))
      .catch(() => {
        // ignore; templates are optional
      });
  }, [token]);

  if (user?.role !== 'admin') {
    return <div className="text-sm text-gray-600">Forbidden.</div>;
  }

  const createdTaskId = (create.data as any)?._id as string | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create task</h1>
          <p className="text-sm text-gray-500 mt-1">Create a draft, then approve to send WhatsApp notifications.</p>
        </div>
        <Link to="/app/dashboard" className="text-sm px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">
          Back
        </Link>
      </div>

      <form
        onSubmit={form.handleSubmit(async (values) => {
          await create.mutateAsync({
            title: values.title,
            description: values.description,
            assignedTo: values.assignedTo,
            priority: values.priority,
            deadline: values.deadline ? new Date(values.deadline) : undefined,
            scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : undefined,
          });
        })}
        className="border border-gray-200 rounded-xl p-6 space-y-5"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Use template (optional)</label>
          <div className="flex items-center gap-2">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5 bg-white"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!templateId}
              onClick={async () => {
                setTemplateError(null);
                try {
                  const res = await apiFetch<{ task: any }>(`/templates/${templateId}/instantiate`, {
                    method: 'POST',
                    token,
                  });
                  const t = res.task;
                  form.setValue('title', t.title, { shouldValidate: true });
                  form.setValue('description', t.description, { shouldValidate: true });
                  form.setValue('assignedTo', t.assignedTo ?? [], { shouldValidate: true });
                  form.setValue('priority', t.priority ?? 'MEDIUM', { shouldValidate: true });
                  setTemplateId('');
                } catch {
                  setTemplateError('Failed to instantiate template.');
                }
              }}
              className="px-3 py-2 rounded-md border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              Apply
            </button>
          </div>
          {templateError ? <div className="text-xs text-red-600">{templateError}</div> : null}
          <div className="text-xs text-gray-500">
            This creates a draft task from a template and pre-fills the form.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              {...form.register('title')}
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
            />
            {form.formState.errors.title ? (
              <div className="text-xs text-red-600">{form.formState.errors.title.message}</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Member search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name/email"
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            {...form.register('priority')}
            className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5 bg-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          {form.formState.errors.priority ? (
            <div className="text-xs text-red-600">{form.formState.errors.priority.message}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...form.register('description')}
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
          />
          {form.formState.errors.description ? (
            <div className="text-xs text-red-600">{form.formState.errors.description.message}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Assign to</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {membersQuery.isLoading ? <div className="text-sm text-gray-500">Loading members…</div> : null}
            {options.map((o) => {
              const checked = form.watch('assignedTo').includes(o.id);
              return (
                <label
                  key={o.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const cur = form.getValues('assignedTo');
                      const next = e.target.checked ? Array.from(new Set([...cur, o.id])) : cur.filter((x) => x !== o.id);
                      form.setValue('assignedTo', next, { shouldValidate: true });
                    }}
                  />
                  <span className="text-sm">{o.label}</span>
                </label>
              );
            })}
          </div>
          {form.formState.errors.assignedTo ? (
            <div className="text-xs text-red-600">{form.formState.errors.assignedTo.message}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Deadline (optional)</label>
            <input
              type="datetime-local"
              {...form.register('deadline')}
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Schedule send (optional)</label>
            <input
              type="datetime-local"
              {...form.register('scheduledAt')}
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600">
            {create.isSuccess && createdTaskId ? (
              <span>
                Draft created. Task id: <span className="font-mono text-xs">{createdTaskId}</span>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 rounded-md bg-black text-white text-sm font-semibold disabled:opacity-60"
            >
              {create.isPending ? 'Creating…' : 'Create draft'}
            </button>
            <button
              type="button"
              disabled={!createdTaskId || approve.isPending}
              onClick={async () => {
                if (!createdTaskId) return;
                await approve.mutateAsync(createdTaskId);
              }}
              className="px-4 py-2 rounded-md border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              {approve.isPending ? 'Approving…' : 'Approve & send'}
            </button>
          </div>
        </div>

        {create.error ? <div className="text-sm text-red-600">Create failed.</div> : null}
        {approve.error ? <div className="text-sm text-red-600">Approve failed.</div> : null}
      </form>
    </div>
  );
}

