import { GoogleLogin } from '@react-oauth/google';
import { useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { useAuth, type User } from '@/auth/AuthProvider';
import { apiFetch, HttpError } from '@/lib/apiClient';

const isDev = import.meta.env.DEV;

export function SignupPage() {
  const { token, user, setSession } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'create' | 'join'>(params.get('code') || params.get('join') ? 'join' : 'create');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState(params.get('code') || '');
  const [err, setErr] = useState<string | null>(null);

  // Dev-only fields
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  if (token && user) {
    if (!user.phone) return <Navigate to="/onboarding/phone" replace />;
    return <Navigate to="/app" replace />;
  }

  const title = useMemo(() => (tab === 'create' ? 'Create organization' : 'Join with invite code'), [tab]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">Every account must belong to an organization.</p>
        </div>

        <div className="flex rounded-lg border border-gray-200 p-0.5 text-sm font-medium">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md ${tab === 'create' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => {
              setTab('create');
              setErr(null);
            }}
          >
            Create org
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md ${tab === 'join' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => {
              setTab('join');
              setErr(null);
            }}
          >
            Join org
          </button>
        </div>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        {tab === 'create' ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Organization name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
              placeholder="Acme Inc"
            />
            <div className="w-full flex justify-center pt-2">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setErr(null);
                  const idToken = credentialResponse.credential;
                  if (!idToken) return;
                  try {
                    const res = await apiFetch<{ token: string; user: User }>('/orgs/signup', {
                      method: 'POST',
                      body: { idToken, orgName: orgName.trim() || 'My organization' },
                    });
                    setSession(res.token, res.user);
                    window.location.assign(res.user.phone ? '/app' : '/onboarding/phone');
                  } catch (e) {
                    setErr(e instanceof HttpError ? e.message : 'Sign-up failed');
                  }
                }}
                onError={() => setErr('Google sign-in failed')}
                useOneTap={false}
              />
            </div>
            {isDev ? (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500">Dev: create org without Google</p>
                <input
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  placeholder="email@dev.local"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  placeholder="Display name (optional)"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                />
                <button
                  type="button"
                  className="w-full py-2 rounded-md border text-sm font-semibold hover:bg-gray-50"
                  onClick={async () => {
                    setErr(null);
                    try {
                      const res = await apiFetch<{ token: string; user: User }>('/orgs/dev-signup', {
                        method: 'POST',
                        body: {
                          email: devEmail,
                          name: devName || undefined,
                          orgName: orgName.trim() || 'Dev Org',
                        },
                      });
                      setSession(res.token, res.user);
                      window.location.assign(res.user.phone ? '/app' : '/onboarding/phone');
                    } catch (e) {
                      setErr(e instanceof HttpError ? e.message : 'Dev sign-up failed');
                    }
                  }}
                >
                  Dev create org
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Invite code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5 font-mono tracking-wide"
              placeholder="XXXXXXXXXX"
            />
            <div className="w-full flex justify-center pt-2">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setErr(null);
                  const idToken = credentialResponse.credential;
                  if (!idToken) return;
                  try {
                    const res = await apiFetch<{ token: string; user: User }>('/orgs/join', {
                      method: 'POST',
                      body: { idToken, code: inviteCode.trim() },
                    });
                    setSession(res.token, res.user);
                    window.location.assign(res.user.phone ? '/app' : '/onboarding/phone');
                  } catch (e) {
                    setErr(e instanceof HttpError ? e.message : 'Join failed');
                  }
                }}
                onError={() => setErr('Google sign-in failed')}
                useOneTap={false}
              />
            </div>
            {isDev ? (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500">Dev: join with invite</p>
                <input
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  placeholder="email@dev.local"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                />
                <button
                  type="button"
                  className="w-full py-2 rounded-md border text-sm font-semibold hover:bg-gray-50"
                  onClick={async () => {
                    setErr(null);
                    try {
                      const res = await apiFetch<{ token: string; user: User }>('/orgs/dev-join', {
                        method: 'POST',
                        body: { email: devEmail, code: inviteCode.trim() },
                      });
                      setSession(res.token, res.user);
                      window.location.assign(res.user.phone ? '/app' : '/onboarding/phone');
                    } catch (e) {
                      setErr(e instanceof HttpError ? e.message : 'Dev join failed');
                    }
                  }}
                >
                  Dev join
                </button>
              </div>
            ) : null}
          </div>
        )}

        <Link
          to="/login"
          className="block w-full text-center px-4 py-3 rounded-md border border-gray-200 text-sm font-semibold hover:bg-gray-50"
        >
          Already have an account? Sign in
        </Link>
        <Link to="/" className="block w-full text-center text-sm text-gray-500">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
