import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getAvailability, lastBookableDate, todayInSouthAfrica } from '@/lib/bookings';
import { findCampus } from '@/lib/campuses';

export const dynamic = 'force-dynamic';

// GET /api/availability?campusId=pretoria&serviceName=Programming%20Lab&date=2026-11-24
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const campusId = params.get('campusId') ?? '';
  const serviceName = params.get('serviceName') ?? '';
  const date = params.get('date') ?? '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return NextResponse.json({ error: 'Choose a valid date.' }, { status: 400 });
  }

  const campus = await findCampus(campusId);
  const service = campus?.services.find((item) => item.name === serviceName);
  if (!campus || !service) {
    return NextResponse.json({ error: 'Select a valid campus lab.' }, { status: 404 });
  }

  const today = todayInSouthAfrica();
  const lastDate = lastBookableDate();
  if (date < today || date > lastDate) {
    return NextResponse.json({ date, slots: [], reason: 'out-of-range', today, lastDate });
  }
  if (service.status !== 'OPEN') {
    return NextResponse.json({ date, slots: [], reason: 'lab-unavailable', today, lastDate });
  }

  const session = await getServerSession(authOptions);
  const slots = await getAvailability(campus, service, date, session?.user.id);

  return NextResponse.json({
    date,
    slots,
    reason: slots.length === 0 ? 'closed' : undefined,
    capacity: service.capacity,
    slotMinutes: campus.slotMinutes,
    today,
    lastDate,
  });
}
