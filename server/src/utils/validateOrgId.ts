import mongoose from 'mongoose';

/**
 * True only for a normal MongoDB ObjectId hex string.
 * Rejects null/undefined, the literal "undefined" / "null", and other garbage.
 */
export function isValidOrgIdString(value: unknown): value is string {
  if (value == null) return false;
  const s = String(value).trim();
  if (s.length !== 24) return false;
  if (!/^[0-9a-fA-F]{24}$/.test(s)) return false;
  return mongoose.Types.ObjectId.isValid(s);
}
