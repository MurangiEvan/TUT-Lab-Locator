import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { ACTIVE_BOOKING_STATUSES, todayInSouthAfrica } from '@/lib/bookings';
import { prisma } from '@/lib/prisma';

// Students cancel their own pending or approved bookings.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to manage your bookings.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if ((body as { status?: unknown } | null)?.status !== 'CANCELLED') {
    return NextResponse.json({ error: 'You can only cancel a booking.' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  // Treat other students' bookings as not found so ids can't be probed.
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }
  if (!(ACTIVE_BOOKING_STATUSES as string[]).includes(booking.status)) {
    return NextResponse.json({ error: 'This booking can no longer be cancelled.' }, { status: 409 });
  }
  if (booking.bookingDate < todayInSouthAfrica()) {
    return NextResponse.json({ error: 'Past bookings cannot be cancelled.' }, { status: 409 });
  }

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
  return NextResponse.json(updated);
}
