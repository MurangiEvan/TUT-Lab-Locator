export const STUDENT_EMAIL_DOMAIN = 'tut4life.ac.za';

export function isValidStudentNumber(value: string) {
  return /^[a-zA-Z0-9.-]+$/.test(value.trim());
}

export function studentEmailFromNumber(value: string) {
  return `${value.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}
