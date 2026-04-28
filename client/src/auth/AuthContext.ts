import { createContext } from 'react';

import type { User, UserRole } from '@/hooks/types';

export type AuthState = {
  token: string | null;
  user: User | null;
  bootstrapped: boolean;
  setToken: (token: string | null) => void;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

