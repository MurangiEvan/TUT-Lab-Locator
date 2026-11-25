export const STUDENT_EMAIL_DOMAIN = 'tut4life.ac.za';

/** The single admin account. Typing just "admin" at sign-in also means this account. */
export const ADMIN_EMAIL = 'admin@tut.ac.za';
const ADMIN_SHORTCUT = 'admin';

export function isValidStudentNumber(value: string) {
  // "admin" is reserved for the admin account and can't be used as a student number.
  return /^[a-zA-Z0-9.-]+$/.test(value.trim()) && value.trim().toLowerCase() !== ADMIN_SHORTCUT;
}

export function studentEmailFromNumber(value: string) {
  return `${value.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

export function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** True when the sign-in text refers to the admin (an email address or just "admin"). */
export function isAdminIdentifier(value: string) {
  return value.trim().toLowerCase() === ADMIN_SHORTCUT || isEmailAddress(value);
}

/**
 * Resolves what a user typed at sign-in or password reset to an account email.
 * Students always use their student number; admins may use either a full email
 * address (e.g. admin@tut.ac.za) or a student number.
 */
export function accountEmailFromIdentifier(value: string, allowEmail: boolean) {
  if (allowEmail && value.trim().toLowerCase() === ADMIN_SHORTCUT) return ADMIN_EMAIL;
  if (allowEmail && isEmailAddress(value)) return value.trim().toLowerCase();
  if (isValidStudentNumber(value)) return studentEmailFromNumber(value);
  return null;
}
