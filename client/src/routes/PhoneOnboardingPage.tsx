import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { apiFetch, HttpError } from '@/lib/apiClient';

export function PhoneOnboardingPage() {
  const { token, user, setSession } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!token) return <Navigate to="/login" replace />;
  const authedToken = token;
  if (user?.phone) return <Navigate to="/app" replace />;

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const res = await apiFetch<{ user: typeof user }>(`/auth/me/phone`, {
        method: 'PATCH',
        token: authedToken,
        body: { phone },
      });
      if (res.user) setSession(authedToken, res.user as any);
      window.location.assign('/app');
    } catch (e) {
      if (e instanceof HttpError) setError(e.message);
      else setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Link your phone</h1>
        <p className="text-sm text-gray-500 mt-2">
          WhatsApp delivery requires an <span className="font-medium">E.164</span> phone number (example: +14155552671).
        </p>

        <div className="mt-6 space-y-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+14155552671"
            className="w-full px-4 py-3 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-black/5"
          />

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            onClick={submit}
            disabled={saving}
            className="w-full px-4 py-3 rounded-md bg-black text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save phone'}
          </button>
        </div>
      </div>
    </div>
  );
}

