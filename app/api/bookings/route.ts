import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ACTIVE_BOOKING_STATUSES, getSlotUsage, todayInSouthAfrica } from '@/lib/bookings';
import { findCampus } from '@/lib/campuses';
import { prisma } from '@/lib/prisma';

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to view your bookings.' }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to book a lab.' }, { status: 401 });
  }
  if (session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only student accounts can book a lab.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'A booking request is required.' }, { status: 400 });
  }

  const { campusId, serviceName, bookingDate, bookingTime } = body as Record<string, unknown>;
  if (
    typeof campusId !== 'string' ||
    typeof serviceName !== 'string' ||
    typeof bookingDate !== 'string' ||
    typeof bookingTime !== 'string'
  ) {
    return NextResponse.json({ error: 'Select a lab, service, date, and time.' }, { status: 400 });
  }

  const campus = await findCampus(campusId);
  const service = campus?.services.find((item) => item.name === serviceName);
  if (!campus || !service) {
    return NextResponse.json({ error: 'Select a valid campus lab and service.' }, { status: 400 });
  }
  if (service.status !== 'OPEN') {
    return NextResponse.json({ error: `${service.name} is not open for bookings right now.` }, { status: 409 });
  }

  if (!isValidDate(bookingDate) || bookingDate < todayInSouthAfrica()) {
    return NextResponse.json({ error: 'Choose a valid date that is not in the past.' }, { status: 400 });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bookingTime)) {
    return NextResponse.json({ error: 'Choose a valid booking time.' }, { status: 400 });
  }

  const duplicate = await prisma.booking.findFirst({
    where: {
      userId: session.user.id,
      campusId: campus.id,
      serviceName,
      bookingDate,
      bookingTime,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: 'You already have a booking for this lab at that time.' }, { status: 409 });
  }

  const usage = await getSlotUsage({ campusId: campus.id, serviceName, bookingDate, bookingTime });
  if (usage.isFull) {
    return NextResponse.json({ error: 'That time slot is fully booked. Please choose another time.' }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      campusId: campus.id,
      campusName: campus.name,
      serviceName,
      bookingDate,
      bookingTime,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
