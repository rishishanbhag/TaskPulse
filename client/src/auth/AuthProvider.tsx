import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch, HttpError } from '@/lib/apiClient';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'member';
};

type AuthState = {
  token: string | null;
  user: User | null;
  bootstrapped: boolean;
  setToken: (token: string | null) => void;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const LS_TOKEN = 'taskpulse.token';

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
    try {
      const res = await apiFetch<{ user: User }>('/auth/me', { method: 'GET', token });
      setUser(res.user);
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        logout();
      } else {
        throw e;
      }
    }
  }, [logout, token]);

  const setSession = useCallback(
    (t: string, u: User) => {
      setToken(t);
      setUser(u);
    },
    [setToken],
  );

  useEffect(() => {
    refreshMe()
      .catch(() => {
        // swallow bootstrap errors; UI can retry on-demand
      })
      .finally(() => setBootstrapped(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, user, bootstrapped, setToken, setSession, logout, refreshMe }),
    [token, user, bootstrapped, setToken, setSession, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

