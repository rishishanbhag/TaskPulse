import { GoogleLogin } from '@react-oauth/google';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { useAuth, type User } from '@/auth/AuthProvider';
import { apiFetch, HttpError } from '@/lib/apiClient';

export function LoginPage() {
  const { token, user, setSession } = useAuth();
  const location = useLocation();

  if (token && user) {
    if (!user.phone) return <Navigate to="/onboarding/phone" replace />;
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-gray-500 mt-2">Use Google to get your TaskPulse session.</p>

        <div className="mt-6 space-y-3">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const idToken = credentialResponse.credential;
                if (!idToken) return;
                try {
                  const res = await apiFetch<{ token: string; user: User }>('/auth/google', {
                    method: 'POST',
                    body: { idToken },
                  });
                  setSession(res.token, res.user);
                  const redirectTo = (location.state as any)?.from ?? (res.user.phone ? '/app' : '/onboarding/phone');
                  window.location.assign(redirectTo);
                } catch (e) {
                  const msg = e instanceof HttpError ? e.message : 'Login failed';
                  // eslint-disable-next-line no-alert
                  alert(msg);
                }
              }}
              onError={() => {
                // eslint-disable-next-line no-alert
                alert('Google sign-in failed');
              }}
              useOneTap={false}
            />
          </div>
          <Link
            to="/"
            className="block w-full text-center px-4 py-3 rounded-md border border-gray-200 text-sm font-semibold hover:bg-gray-50"
          >
            Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}

