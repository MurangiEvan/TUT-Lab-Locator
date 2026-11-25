import { NextResponse } from 'next/server';

import { sendMail } from '@/lib/mailer';
import { createPasswordResetToken, RESET_TOKEN_TTL_MINUTES } from '@/lib/password-reset';
import { prisma } from '@/lib/prisma';
import { accountEmailFromIdentifier, isEmailAddress } from '@/lib/student-email';

// The same response is returned whether or not the account exists, so this
// endpoint cannot be used to discover which student numbers are registered.
const GENERIC_RESPONSE = {
  message: 'If an account exists for those details, a password reset link has been sent to its email address.',
};

function appUrl(request: Request) {
  return (process.env.NEXTAUTH_URL ?? new URL(request.url).origin).replace(/\/$/, '');
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const identifier = (body as { studentNumber?: unknown } | null)?.studentNumber;
  const email = typeof identifier === 'string' ? accountEmailFromIdentifier(identifier, true) : null;
  if (typeof identifier !== 'string' || !email) {
    return NextResponse.json({ error: 'Enter a valid student number or admin email.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Email addresses are only accepted for admin accounts; students use their student number.
  if (!user || (isEmailAddress(identifier) && user.role !== 'ADMIN')) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const token = await createPasswordResetToken(user.id);
  if (!token) return NextResponse.json(GENERIC_RESPONSE);

  const resetUrl = `${appUrl(request)}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = user.name ? `Hi ${user.name},` : 'Hi,';

  try {
    await sendMail({
      to: user.email,
      subject: 'Reset your TUT Labs password',
      text: `${greeting}\n\nWe received a request to reset your TUT Labs password. Open the link below to choose a new one. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes and can only be used once.\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email; your password will not change.`,
      html: `<p>${escapeHtml(greeting)}</p><p>We received a request to reset your TUT Labs password. Click the button below to choose a new one. The link expires in ${RESET_TOKEN_TTL_MINUTES} minutes and can only be used once.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#c8102e;color:#fff;font-weight:600;text-decoration:none">Reset password</a></p><p style="color:#64748b;font-size:13px">If the button doesn't work, paste this link into your browser:<br>${resetUrl}</p><p style="color:#64748b;font-size:13px">If you didn't request this, you can ignore this email; your password will not change.</p>`,
    });
  } catch (error) {
    console.error('Failed to send password reset email', error);
    return NextResponse.json({ error: 'We could not send the reset email right now. Please try again later.' }, { status: 503 });
  }

  return NextResponse.json(GENERIC_RESPONSE);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
