import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

  const campus = findCampus(campusId);
  if (!campus || !campus.services.some((service) => service.name === serviceName)) {
    return NextResponse.json({ error: 'Select a valid campus lab and service.' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (!isValidDate(bookingDate) || bookingDate < today) {
    return NextResponse.json({ error: 'Choose a valid date that is not in the past.' }, { status: 400 });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bookingTime)) {
    return NextResponse.json({ error: 'Choose a valid booking time.' }, { status: 400 });
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
