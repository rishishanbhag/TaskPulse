import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { apiFetch, HttpError } from '@/lib/apiClient';
import type { User } from '@/hooks/types';

const isDev = import.meta.env.DEV;

export function LoginPage() {
  const { token, user, setSession } = useAuth();
  const location = useLocation();
  const [devEmail, setDevEmail] = useState('');
  const [needsOrgMessage, setNeedsOrgMessage] = useState(false);

  if (token && user) {
    if (!user.phone) return <Navigate to="/onboarding/phone" replace />;
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-gray-500 mt-2">
          For returning users who already belong to an organization. New? Use sign up to create a workspace or join with a code.
        </p>

        {needsOrgMessage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">No organization on this account yet</p>
            <p className="mt-1 text-amber-900/90">
              First, create a new organization or join with an invite from your admin—then you can use sign in here.
            </p>
            <Link to="/signup" className="mt-3 inline-block text-sm font-semibold text-amber-950 underline">
              Go to sign up — create or join
            </Link>
          </div>
        ) : null}

        <div className="w-full flex justify-center pt-2">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const idToken = credentialResponse.credential;
              if (!idToken) return;
              setNeedsOrgMessage(false);
              try {
                const res = await apiFetch<{ token: string; user: User }>('/auth/google', {
                  method: 'POST',
                  body: { idToken },
                });
                setSession(res.token, res.user);
                const redirectTo = (location.state as { from?: string } | null)?.from ?? (res.user.phone ? '/app' : '/onboarding/phone');
                window.location.assign(redirectTo);
              } catch (e) {
                if (e instanceof HttpError && e.apiError?.code === 'NEEDS_ORGANIZATION') {
                  setNeedsOrgMessage(true);
                  return;
                }
                const msg = e instanceof HttpError
                  ? e.message
                  : 'Server is starting up — please try again in a few seconds.';
                alert(msg);
              }
            }}
            onError={() => {
               
              alert('Google sign-in failed');
            }}
            useOneTap={false}
          />
        </div>

        <Link
          to="/signup"
          className="block w-full text-center px-4 py-3 rounded-md border border-gray-200 text-sm font-semibold hover:bg-gray-50"
        >
          New here? Create or join an organization
        </Link>

        {isDev ? (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-500">Dev email login (same account as dev-signup)</p>
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
                setNeedsOrgMessage(false);
                try {
                  const res = await apiFetch<{ token: string; user: User }>('/auth/dev-login', {
                    method: 'POST',
                    body: { email: devEmail },
                  });
                  setSession(res.token, res.user);
                  window.location.assign(res.user.phone ? '/app' : '/onboarding/phone');
                } catch (e) {
                  if (e instanceof HttpError && e.apiError?.code === 'NEEDS_ORGANIZATION') {
                    setNeedsOrgMessage(true);
                    return;
                  }
                   
                  alert(e instanceof HttpError ? e.message : 'Dev login failed');
                }
              }}
            >
              Dev sign in
            </button>
          </div>
        ) : null}

        <Link to="/" className="block w-full text-center text-sm text-gray-500">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
