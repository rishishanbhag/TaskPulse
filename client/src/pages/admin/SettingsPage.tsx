import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { useGroups } from '@/hooks/useGroups';
import { useMembers } from '@/hooks/useMembers';
import { apiFetch, HttpError } from '@/lib/apiClient';
import type { User } from '@/hooks/types';

type Tab = 'members' | 'groups' | 'invites';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace settings</h1>
        <p className="text-sm text-gray-500 mt-1">Members, groups, and invite links.</p>
      </div>

      <div className="flex gap-2 text-sm">
        {(['members', 'groups', 'invites'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md border ${tab === t ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {msg ? <div className="text-sm text-green-700">{msg}</div> : null}
      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      {tab === 'members' && hasRole('owner', 'admin') ? (
        <div className="border border-gray-200 rounded-xl divide-y">
          {(membersQ.data ?? []).map((m) => (
            <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-4 text-sm">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-gray-500">{m.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.role}</div>
              </div>
              {hasRole('owner', 'admin') && m.id !== user.id && m.role !== 'owner' ? (
                <button
                  type="button"
                  className="text-red-600 text-xs font-medium"
                  onClick={() => {
                    if (hasRole('admin') && m.role === 'admin') {
                      // eslint-disable-next-line no-alert
                      alert('Admins cannot remove other admins.');
                      return;
                    }
                    if (window.confirm('Remove this user from the organization?')) removeMember.mutate(m.id);
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'groups' && hasRole('owner', 'admin', 'manager') ? (
        <div className="space-y-4">
          {hasRole('owner', 'admin') ? (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setErr(null);
                setMsg(null);
                if (!groupName.trim()) return;
                createGroup.mutate(groupName.trim());
              }}
            >
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium">New group</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-md border"
                  placeholder="Engineering"
                />
              </div>
              <button type="submit" className="px-4 py-2 rounded-md border text-sm font-semibold hover:bg-gray-50">
                Create
              </button>
            </form>
          ) : null}

          <div className="border border-gray-200 rounded-xl divide-y">
            {(groupsQ.data ?? []).map((g) => (
              <div key={g._id} className="px-4 py-3 space-y-2">
                <div className="font-medium">{g.name}</div>
                {hasRole('owner', 'admin', 'manager') ? (
                  <div className="flex flex-wrap gap-2 items-end">
                    <select
                      className="text-sm border rounded-md px-2 py-1.5"
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
                      className="text-sm px-3 py-1.5 rounded-md border"
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
                      Add
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'invites' && hasRole('owner', 'admin') ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-sm font-medium">Default role for invite</label>
              <select
                className="block mt-1 border rounded-md px-2 py-1.5 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'member' | 'manager' | 'admin')}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Expires in (hours)</label>
              <input
                type="number"
                className="block mt-1 border rounded-md px-2 py-1.5 text-sm w-24"
                value={inviteHours}
                min={1}
                max={8760}
                onChange={(e) => setInviteHours(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-md border text-sm font-semibold"
              onClick={() => {
                setErr(null);
                createInvite.mutate();
              }}
            >
              Create invite
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl divide-y text-sm">
            {(invitesQ.data ?? []).map((i) => (
              <div key={i._id} className="px-4 py-2 font-mono text-xs">
                {i.code} — {i.defaultRole} {i.usedAt ? '(used)' : ''}{' '}
                {i.expiresAt ? `expires ${i.expiresAt}` : ''}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
