import { createHash, randomBytes } from 'crypto';

import { prisma } from '@/lib/prisma';

export const RESET_TOKEN_TTL_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 3;
const REQUEST_WINDOW_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 6;

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a single-use reset token for the user and returns the raw token.
 * Returns null when the user has requested too many resets recently.
 */
export async function createPasswordResetToken(userId: string) {
  const windowStart = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60_000);
  const recentRequests = await prisma.passwordResetToken.count({
    where: { userId, createdAt: { gte: windowStart } },
  });
  if (recentRequests >= MAX_REQUESTS_PER_WINDOW) return null;

  const token = randomBytes(32).toString('base64url');
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
    },
  });
  return token;
}

/** Returns the token record if it exists, is unused, and has not expired. */
export async function findValidResetToken(token: string) {
  if (!token) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}
