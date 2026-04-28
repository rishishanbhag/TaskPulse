import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Users, FolderOpen, Link2, Plus, Trash2, UserPlus, Copy } from 'lucide-react';

import { useAuth } from '@/auth/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { useMembers } from '@/hooks/useMembers';
import { apiFetch, HttpError } from '@/lib/apiClient';
import type { User } from '@/hooks/types';

type Tab = 'members' | 'groups' | 'invites';

const tabConfig: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'groups', label: 'Groups', icon: FolderOpen },
  { id: 'invites', label: 'Invites', icon: Link2 },
];

export function SettingsPage() {
  const { token, user, hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('members');
  const [groupName, setGroupName] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'manager' | 'admin'>('member');
  const [inviteHours, setInviteHours] = useState(72);
  const [memberPickByGroup, setMemberPickByGroup] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const membersQ = useQuery({
    queryKey: ['org', 'members'],
    enabled: !!token && hasRole('owner', 'admin'),
    queryFn: async () => {
      const res = await apiFetch<{ members: User[] }>('/orgs/me/members', { method: 'GET', token: token! });
      return res.members;
    },
  });

  const invitesQ = useQuery({
    queryKey: ['org', 'invites'],
    enabled: !!token && hasRole('owner', 'admin'),
    queryFn: async () => {
      const res = await apiFetch<{ invites: { _id: string; code: string; usedAt?: string; expiresAt?: string; defaultRole: string }[] }>(
        '/orgs/me/invites',
        { method: 'GET', token: token! },
      );
      return res.invites;
    },
  });

  const groupsQ = useGroups();

  const createGroup = useMutation({
    mutationFn: async (name: string) => {
      await apiFetch('/groups', { method: 'POST', token: token!, body: { name } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setGroupName('');
      setMsg('Group created.');
    },
    onError: (e) => setErr(e instanceof HttpError ? e.message : 'Failed'),
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      return apiFetch<{ url: string; invite: { code: string } }>('/orgs/me/invites', {
        method: 'POST',
        token: token!,
        body: { defaultRole: inviteRole, expiresInHours: inviteHours },
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['org', 'invites'] });
      setMsg(`Invite: ${data.invite.code} — ${data.url}`);
    },
    onError: (e) => setErr(e instanceof HttpError ? e.message : 'Failed'),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/orgs/me/members/${id}`, { method: 'DELETE', token: token! });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'members'] });
    },
  });

  const allMembers = useMembers();

  if (!user) return null;

  function roleBadge(role: string) {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider';
    if (role === 'owner') return `${base} bg-purple-100 text-purple-700`;
    if (role === 'admin') return `${base} bg-blue-100 text-blue-700`;
    if (role === 'manager') return `${base} bg-amber-100 text-amber-700`;
    return `${base} bg-gray-100 text-gray-600`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage members, groups, and invite links.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {tabConfig.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setMsg(null); setErr(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {msg ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm ring-1 ring-emerald-200">
          {msg}
          {msg.includes('http') ? (
            <button
              type="button"
              className="ml-auto p-1 rounded hover:bg-emerald-100 transition-colors"
              onClick={() => {
                const url = msg.match(/(https?:\/\/\S+)/)?.[1];
                if (url) navigator.clipboard.writeText(url);
              }}
            >
              <Copy className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {err ? (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm ring-1 ring-red-200">{err}</div>
      ) : null}

      {/* Members Tab */}
      {tab === 'members' && hasRole('owner', 'admin') ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {membersQ.data?.length ?? 0} Members
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {(membersQ.data ?? []).map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {m.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={roleBadge(m.role)}>{m.role}</span>
                  {hasRole('owner', 'admin') && m.id !== user.id && m.role !== 'owner' ? (
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove member"
                      onClick={() => {
                        if (hasRole('admin') && m.role === 'admin') {
                          alert('Admins cannot remove other admins.');
                          return;
                        }
                        if (window.confirm('Remove this user from the organization?')) removeMember.mutate(m.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Groups Tab */}
      {tab === 'groups' && hasRole('owner', 'admin', 'manager') ? (
        <div className="space-y-4">
          {hasRole('owner', 'admin') ? (
            <form
              className="flex flex-wrap items-end gap-3 p-4 bg-white border border-gray-200 rounded-xl"
              onSubmit={(e) => {
                e.preventDefault();
                setErr(null);
                setMsg(null);
                if (!groupName.trim()) return;
                createGroup.mutate(groupName.trim());
              }}
            >
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700">Create new group</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 transition-shadow"
                  placeholder="e.g. Engineering"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </form>
          ) : null}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100">
            {(groupsQ.data ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No groups yet.</div>
            ) : null}
            {(groupsQ.data ?? []).map((g) => (
              <div key={g._id} className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-sm">{g.name}</span>
                </div>
                {hasRole('owner', 'admin', 'manager') ? (
                  <div className="flex flex-wrap gap-2 items-end">
                    <select
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/10 bg-white transition-shadow"
                      value={memberPickByGroup[g._id] ?? ''}
                      onChange={(e) => setMemberPickByGroup((p) => ({ ...p, [g._id]: e.target.value }))}
                    >
                      <option value="">Add member…</option>
                      {(allMembers.data ?? [])
                        .filter((u) => !((g as { members?: string[] }).members ?? []).includes(u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 font-medium hover:bg-gray-50 transition-colors"
                      onClick={async () => {
                        const userId = memberPickByGroup[g._id];
                        if (!userId) {
                          setErr('Select a user');
                          return;
                        }
                        setErr(null);
                        try {
                          await apiFetch(`/groups/${g._id}/members`, {
                            method: 'POST',
                            token: token!,
                            body: { userId },
                          });
                          qc.invalidateQueries({ queryKey: ['groups'] });
                          setMemberPickByGroup((p) => {
                            const n = { ...p };
                            delete n[g._id];
                            return n;
                          });
                          setMsg('Member added to group.');
                        } catch (e) {
                          setErr(e instanceof HttpError ? e.message : 'Add failed');
                        }
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Invites Tab */}
      {tab === 'invites' && hasRole('owner', 'admin') ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end p-4 bg-white border border-gray-200 rounded-xl">
            <div>
              <label className="text-sm font-medium text-gray-700">Default role</label>
              <select
                className="block mt-1.5 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'member' | 'manager' | 'admin')}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Expires in (hours)</label>
              <input
                type="number"
                className="block mt-1.5 border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-24 outline-none focus:ring-2 focus:ring-gray-900/10"
                value={inviteHours}
                min={1}
                max={8760}
                onChange={(e) => setInviteHours(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              onClick={() => {
                setErr(null);
                createInvite.mutate();
              }}
            >
              <Link2 className="w-4 h-4" />
              Create invite
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {invitesQ.data?.length ?? 0} Invites
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {(invitesQ.data ?? []).length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">No invites yet.</div>
              ) : null}
              {(invitesQ.data ?? []).map((i) => (
                <div key={i._id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{i.code}</code>
                    <span className={roleBadge(i.defaultRole)}>{i.defaultRole}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {i.usedAt ? (
                      <span className="text-emerald-600 font-medium">Used</span>
                    ) : i.expiresAt ? (
                      `Expires ${new Date(i.expiresAt).toLocaleDateString()}`
                    ) : (
                      'No expiry'
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
