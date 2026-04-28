import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Send, Calendar, Users, AlignLeft, Flag, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/auth/useAuth';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useGroups } from '@/hooks/useGroups';
import { useMembers } from '@/hooks/useMembers';
import { useApproveTask, useCreateTask } from '@/hooks/mutations';
import { apiFetch } from '@/lib/apiClient';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const schema = z.object({
  title: z.string().min(1).max(200),
  descriptionHtml: z.string().min(1).max(20_000),
  groupId: z.string().optional(),
  assignedTo: z.array(z.string().min(1)).min(1, 'Pick at least one member'),
  priority: priorityEnum,
  deadline: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateTaskPage() {
  const { user, token, hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const groupsQ = useGroups();
  const [templateId, setTemplateId] = useState<string>('');
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ _id: string; name: string }[]>([]);
  const create = useCreateTask();
  const approve = useApproveTask();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      descriptionHtml: '<p><br></p>',
      groupId: '',
      assignedTo: [],
      priority: 'MEDIUM',
    },
  });

  const groupId = form.watch('groupId');
  const membersQuery = useMembers(search, groupId || undefined);

  const members = membersQuery.data ?? [];
  const options = useMemo(
    () => members.map((m) => ({ id: m.id, label: `${m.name} (${m.email})` })),
    [members],
  );

  useEffect(() => {
    if (!token) return;
    apiFetch<{ templates: { _id: string; name: string }[] }>('/templates', { method: 'GET', token })
      .then((res) => setTemplates(res.templates ?? []))
      .catch(() => {
        // ignore; templates are optional
      });
  }, [token]);

  if (!hasRole('owner', 'admin', 'manager')) {
    return <div className="text-sm text-gray-600 p-8">Forbidden.</div>;
  }

  const createdTaskId = create.data?._id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/app/dashboard"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Task</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create a draft, then approve to send WhatsApp notifications.</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(async (values) => {
          if (user?.role === 'manager' && !values.groupId?.trim()) {
            alert('Managers must select a group for each task.');
            return;
          }
          await create.mutateAsync({
            title: values.title,
            descriptionHtml: values.descriptionHtml,
            ...(values.groupId?.trim() ? { groupId: values.groupId.trim() } : {}),
            assignedTo: values.assignedTo,
            priority: values.priority,
            deadline: values.deadline ? new Date(values.deadline) : undefined,
            scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : undefined,
          });
        })}
        className="space-y-6"
      >
        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <label className="text-sm font-semibold text-blue-900 mb-2 block">Use a Template</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="flex-1 w-full px-3 py-2.5 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
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
                    const res = await apiFetch<{ task: { title: string; descriptionHtml?: string | null; description?: string | null; assignedTo?: string[]; priority?: string } }>(
                      `/templates/${templateId}/instantiate`,
                      {
                      method: 'POST',
                      token,
                      },
                    );
                    const t = res.task;
                    form.setValue('title', t.title, { shouldValidate: true });
                    if (t.descriptionHtml) form.setValue('descriptionHtml', t.descriptionHtml, { shouldValidate: true });
                    else form.setValue('descriptionHtml', `<p>${String(t.description ?? '').replace(/</g, '&lt;')}</p>`, { shouldValidate: true });
                    form.setValue('assignedTo', t.assignedTo ?? [], { shouldValidate: true });
                    form.setValue('priority', (t.priority as FormValues['priority']) ?? 'MEDIUM', { shouldValidate: true });
                    setTemplateId('');
                  } catch {
                    setTemplateError('Failed to instantiate template.');
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Apply Template
              </button>
            </div>
            {templateError ? <div className="text-xs text-red-600 mt-2">{templateError}</div> : null}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-6 space-y-6">
            {/* Title & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <AlignLeft className="w-4 h-4 text-gray-400" />
                  Task Title
                </label>
                <input
                  {...form.register('title')}
                  placeholder="e.g. Weekly Inventory Check"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 transition-shadow text-gray-900"
                />
                {form.formState.errors.title ? (
                  <div className="text-xs text-red-600">{form.formState.errors.title.message}</div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Flag className="w-4 h-4 text-gray-400" />
                  Priority
                </label>
                <select
                  {...form.register('priority')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 bg-white transition-shadow text-gray-900"
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
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10 transition-shadow">
                <Controller
                  name="descriptionHtml"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value} onChange={field.onChange} readOnly={create.isPending} />
                  )}
                />
              </div>
              {form.formState.errors.descriptionHtml ? (
                <div className="text-xs text-red-600">{form.formState.errors.descriptionHtml.message}</div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-gray-100 p-6 space-y-6 bg-gray-50/30">
            {/* Assignments Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5 flex-1 max-w-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" />
                  Group (Optional)
                </label>
                <select
                  {...form.register('groupId')}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="">No group (all members)</option>
                  {(groupsQ.data ?? []).map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 flex-1 max-w-sm">
                <label className="text-sm font-semibold text-gray-700">Filter Members</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 text-sm bg-white"
                />
              </div>
            </div>

            {/* Member Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Assign To</label>
                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {form.watch('assignedTo').length} selected
                </span>
              </div>
              {user?.role === 'manager' && groupId ? (
                <p className="text-xs text-gray-500">Only people already added to this group in Settings can be assigned.</p>
              ) : (user?.role === 'owner' || user?.role === 'admin') && groupId ? (
                <p className="text-xs text-gray-500">
                  Choose anyone with the <span className="font-medium">member</span> role in the org. They will be added to this group when you create the task if they are not in it already.
                </p>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                {membersQuery.isLoading ? <div className="text-sm text-gray-500 p-2">Loading members…</div> : null}
                {options.length === 0 && !membersQuery.isLoading ? (
                  <div className="text-sm text-gray-500 p-2 col-span-full">No members found.</div>
                ) : null}
                {options.map((o) => {
                  const checked = form.watch('assignedTo').includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        checked 
                          ? 'border-gray-900 bg-gray-900/5 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 border-gray-300 accent-gray-900"
                        onChange={(e) => {
                          const cur = form.getValues('assignedTo');
                          const next = e.target.checked ? Array.from(new Set([...cur, o.id])) : cur.filter((x) => x !== o.id);
                          form.setValue('assignedTo', next, { shouldValidate: true });
                        }}
                      />
                      <span className="text-sm font-medium text-gray-800 truncate" title={o.label}>{o.label}</span>
                    </label>
                  );
                })}
              </div>
              {form.formState.errors.assignedTo ? (
                <div className="text-xs text-red-600">{form.formState.errors.assignedTo.message}</div>
              ) : null}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  {...form.register('deadline')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Send className="w-4 h-4 text-gray-400" />
                  Schedule Send (Optional)
                </label>
                <input
                  type="datetime-local"
                  {...form.register('scheduledAt')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm font-medium">
            {create.isSuccess && createdTaskId ? (
              <span className="text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Draft saved (ID: <span className="font-mono text-xs bg-emerald-50 px-1 rounded">{createdTaskId.substring(0, 8)}...</span>)
              </span>
            ) : null}
            {create.error ? <span className="text-red-600">Failed to create task.</span> : null}
            {approve.error ? <span className="text-red-600">Failed to approve task.</span> : null}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 disabled:opacity-60 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {create.isPending ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={!createdTaskId || approve.isPending}
              onClick={async () => {
                if (!createdTaskId) return;
                await approve.mutateAsync(createdTaskId);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-60 disabled:bg-gray-400 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              {approve.isPending ? 'Sending…' : 'Approve & Send'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
