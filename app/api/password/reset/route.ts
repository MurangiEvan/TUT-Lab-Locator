import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { findValidResetToken, MIN_PASSWORD_LENGTH } from '@/lib/password-reset';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { token, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const record = await findValidResetToken(token);
  if (!record) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired. Request a new one.' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Claim the token atomically so two concurrent submissions can't both use it.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    // Invalidate any other outstanding reset links for this account.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  return NextResponse.json({ message: 'Your password has been reset. You can now sign in.' });
}
