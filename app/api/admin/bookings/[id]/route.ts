import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminApi } from '@/lib/admin';
import { getSlotUsage } from '@/lib/bookings';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

const DECISIONS = ['APPROVED', 'REJECTED'] as const;
type Decision = (typeof DECISIONS)[number];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if ('denied' in auth) return auth.denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { status, note } = (body ?? {}) as Record<string, unknown>;
  if (typeof status !== 'string' || !(DECISIONS as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Status must be APPROVED or REJECTED.' }, { status: 400 });
  }
  const adminNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null;

  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'The student cancelled this booking.' }, { status: 409 });
  }

  if (status === 'APPROVED') {
    const usage = await getSlotUsage(booking, booking.id);
    if (usage.isFull) {
      return NextResponse.json(
        { error: `This slot is full: ${usage.approved} of ${usage.capacity} seats are already approved.` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status,
      adminNote,
      reviewedAt: new Date(),
      reviewedById: auth.session.user.id,
    },
  });

  // Notify the student. A mail failure shouldn't undo the admin's decision.
  if (booking.status !== status) {
    notifyStudent(booking.user, booking, status as Decision, adminNote).catch((error) =>
      console.error('Failed to send booking decision email', error),
    );
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/welcome');
  return NextResponse.json(updated);
}

async function notifyStudent(
  user: { email: string; name: string | null },
  booking: { campusName: string; serviceName: string; bookingDate: string; bookingTime: string },
  status: Decision,
  note: string | null,
) {
  const approved = status === 'APPROVED';
  const what = `${booking.serviceName} at ${booking.campusName} on ${booking.bookingDate} at ${booking.bookingTime}`;
  const intro = approved
    ? `Good news: your booking for ${what} has been approved.`
    : `Unfortunately your booking for ${what} was not approved.`;
  const noteLine = note ? `\n\nNote from the lab admin: ${note}` : '';
  const greeting = user.name ? `Hi ${user.name},` : 'Hi,';
  const appUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
  const link = appUrl ? `\n\nView your bookings: ${appUrl}/welcome` : '';

  await sendMail({
    to: user.email,
    subject: approved ? 'Your TUT Labs booking is approved' : 'Your TUT Labs booking was not approved',
    text: `${greeting}\n\n${intro}${noteLine}${link}`,
    html: [greeting, intro, note ? `<strong>Note from the lab admin:</strong> ${escapeHtml(note)}` : '', appUrl ? `<a href="${appUrl}/welcome">View your bookings</a>` : '']
      .filter(Boolean)
      .map((line, i) => (i < 2 ? `<p>${escapeHtml(line)}</p>` : `<p>${line}</p>`))
      .join(''),
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
