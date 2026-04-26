import { UserRole } from '@/models/User.js';

export type Role = (typeof UserRole)[keyof typeof UserRole];
export const ROLES = Object.values(UserRole) as Role[];

export function isManagerOrAbove(role: Role) {
  return role === UserRole.OWNER || role === UserRole.ADMIN || role === UserRole.MANAGER;
}

export function isAdminOrOwner(role: Role) {
  return role === UserRole.OWNER || role === UserRole.ADMIN;
}
