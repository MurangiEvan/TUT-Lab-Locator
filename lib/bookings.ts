import { prisma } from '@/lib/prisma';

export const bookingStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

/** Statuses that hold a seat in a lab slot. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'APPROVED'];

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && (bookingStatuses as readonly string[]).includes(value);
}

/** Today's date as YYYY-MM-DD in South African time, matching how bookings are entered. */
export function todayInSouthAfrica() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());
}

type Slot = { campusId: string; serviceName: string; bookingDate: string; bookingTime: string };

/**
 * How many approved bookings a lab slot already has, and the lab's capacity
 * (null when the admin hasn't set a seat count, meaning unlimited).
 */
export async function getSlotUsage(slot: Slot, excludeBookingId?: string) {
  // Pick fields explicitly: callers may pass a whole Booking, whose other
  // fields (userId, status, ...) must not leak into the filter.
  const { campusId, serviceName, bookingDate, bookingTime } = slot;
  const [approved, service] = await Promise.all([
    prisma.booking.count({
      where: {
        campusId,
        serviceName,
        bookingDate,
        bookingTime,
        status: 'APPROVED',
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
      },
    }),
    prisma.labService.findUnique({
      where: { campusId_name: { campusId, name: serviceName } },
      select: { capacity: true },
    }),
  ]);
  const capacity = service?.capacity ?? null;
  return { approved, capacity, isFull: capacity !== null && approved >= capacity };
}
