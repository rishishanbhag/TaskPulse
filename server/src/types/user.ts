import type { Role } from './role.js';

export type AuthedUser = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
};
