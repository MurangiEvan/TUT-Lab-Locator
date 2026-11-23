import { prisma } from '@/lib/prisma';
import { getCampusSchedule, slotEnd, slotsForDate } from '@/lib/schedule';

export const bookingStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

/** Statuses that hold a seat in a lab slot. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'APPROVED'];

/** How far ahead students may book. */
export const BOOKING_WINDOW_DAYS = 30;

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && (bookingStatuses as readonly string[]).includes(value);
}

const SA_TIME_ZONE = 'Africa/Johannesburg';

/** Today's date as YYYY-MM-DD in South African time, matching how bookings are entered. */
export function todayInSouthAfrica() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SA_TIME_ZONE }).format(new Date());
}

/** Current time as HH:MM in South African time. */
export function timeNowInSouthAfrica() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: SA_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    new Date(),
  );
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function lastBookableDate() {
  return addDays(todayInSouthAfrica(), BOOKING_WINDOW_DAYS);
}

type Slot = { campusId: string; serviceName: string; bookingDate: string; bookingTime: string };

/**
 * Seat usage for one lab slot. `held` counts pending + approved bookings (seats
 * students have claimed); `approved` counts only confirmed ones. `capacity` is
 * null when the admin hasn't set a seat count, meaning unlimited.
 */
export async function getSlotUsage(slot: Slot, excludeBookingId?: string) {
  // Pick fields explicitly: callers may pass a whole Booking, whose other
  // fields (userId, status, ...) must not leak into the filter.
  const { campusId, serviceName, bookingDate, bookingTime } = slot;
  const [counts, service] = await Promise.all([
    prisma.booking.groupBy({
      by: ['status'],
      where: {
        campusId,
        serviceName,
        bookingDate,
        bookingTime,
        status: { in: ACTIVE_BOOKING_STATUSES },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
      },
      _count: { _all: true },
    }),
    prisma.labService.findUnique({
      where: { campusId_name: { campusId, name: serviceName } },
      select: { capacity: true },
    }),
  ]);
  const approved = counts.find((c) => c.status === 'APPROVED')?._count._all ?? 0;
  const held = counts.reduce((sum, c) => sum + c._count._all, 0);
  const capacity = service?.capacity ?? null;
  return {
    approved,
    held,
    capacity,
    /** No more bookings may be approved. */
    approvalFull: capacity !== null && approved >= capacity,
    /** No more requests may be made. */
    requestFull: capacity !== null && held >= capacity,
  };
}

export type SlotAvailability = {
  start: string;
  end: string;
  /** Seats left, or null when the lab has no seat limit. */
  remaining: number | null;
  state: 'available' | 'full' | 'past' | 'yours';
};

type CampusForSlots = { id: string; schedule: string; hours: string; slotMinutes: number };

/** Every slot on a date for one lab, with how many seats are left. */
export async function getAvailability(
  campus: CampusForSlots,
  service: { name: string; capacity: number | null },
  date: string,
  userId?: string,
): Promise<SlotAvailability[]> {
  const starts = slotsForDate(getCampusSchedule(campus), date, campus.slotMinutes);
  if (starts.length === 0) return [];

  const bookings = await prisma.booking.findMany({
    where: {
      campusId: campus.id,
      serviceName: service.name,
      bookingDate: date,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
    select: { bookingTime: true, userId: true },
  });

  const heldBySlot = new Map<string, number>();
  const mine = new Set<string>();
  for (const booking of bookings) {
    heldBySlot.set(booking.bookingTime, (heldBySlot.get(booking.bookingTime) ?? 0) + 1);
    if (userId && booking.userId === userId) mine.add(booking.bookingTime);
  }

  const today = todayInSouthAfrica();
  const now = timeNowInSouthAfrica();

  return starts.map((start) => {
    const remaining = service.capacity === null ? null : Math.max(0, service.capacity - (heldBySlot.get(start) ?? 0));
    let state: SlotAvailability['state'] = 'available';
    if (mine.has(start)) state = 'yours';
    else if (date < today || (date === today && start <= now)) state = 'past';
    else if (remaining === 0) state = 'full';
    return { start, end: slotEnd(start, campus.slotMinutes), remaining, state };
  });
}
