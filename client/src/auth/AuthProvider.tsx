import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiFetch, HttpError } from '@/lib/apiClient';
import { AuthContext, type AuthState } from '@/auth/AuthContext';
import type { User, UserRole } from '@/hooks/types';

const LS_TOKEN = 'taskpulse.token';

async function refreshMeImpl(input: { token: string; logout: () => void; setUser: (u: User | null) => void }) {
  try {
    const res = await apiFetch<{ user: User }>('/auth/me', { method: 'GET', token: input.token });
    input.setUser(res.user);
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) {
      input.logout();
    } else {
      throw e;
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(LS_TOKEN));
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (!t) localStorage.removeItem(LS_TOKEN);
    else localStorage.setItem(LS_TOKEN, t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.location.assign('/login');
  }, [setToken]);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    await refreshMeImpl({ token, logout, setUser });
  }, [logout, token]);

  const setSession = useCallback(
    (t: string, u: User) => {
      setToken(t);
      setUser(u);
    },
    [setToken],
  );

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        await refreshMeImpl({
          token,
          logout: () => {
            if (!cancelled) logout();
          },
          setUser: (u) => {
            if (!cancelled) setUser(u);
          },
        });
      } catch {
        // swallow bootstrap errors; UI can retry on-demand
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [logout, token]);

  const value = useMemo<AuthState>(
    () => ({ token, user, bootstrapped, setToken, setSession, logout, refreshMe, hasRole }),
    [token, user, bootstrapped, setToken, setSession, logout, refreshMe, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
