import Link from 'next/link';
import type { Prisma } from '@prisma/client';

import { BookingDecision } from '@/components/admin/booking-decision';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { bookingStatuses, isBookingStatus, todayInSouthAfrica } from '@/lib/bookings';
import { getCampuses } from '@/lib/campuses';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 100;
const tabs = [...bookingStatuses, 'ALL'] as const;
const tabLabels: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  ALL: 'All',
};

function slotKey(b: { campusId: string; serviceName: string; bookingDate: string; bookingTime: string }) {
  return `${b.campusId}|${b.serviceName}|${b.bookingDate}|${b.bookingTime}`;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: { status?: string; campus?: string };
}) {
  const status = searchParams?.status === 'ALL' ? 'ALL' : isBookingStatus(searchParams?.status) ? searchParams.status : 'PENDING';
  const campusFilter = searchParams?.campus || undefined;
  const today = todayInSouthAfrica();

  const where: Prisma.BookingWhereInput = {
    ...(status === 'ALL' ? {} : { status }),
    ...(campusFilter ? { campusId: campusFilter } : {}),
  };

  const [bookings, counts, campuses] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { user: { select: { name: true, email: true } }, reviewedBy: { select: { name: true, email: true } } },
      // Pending: soonest first so urgent requests are at the top. Otherwise: most recent first.
      orderBy:
        status === 'PENDING'
          ? [{ bookingDate: 'asc' }, { bookingTime: 'asc' }]
          : [{ bookingDate: 'desc' }, { bookingTime: 'desc' }],
      take: PAGE_SIZE,
    }),
    prisma.booking.groupBy({
      by: ['status'],
      where: campusFilter ? { campusId: campusFilter } : undefined,
      _count: { _all: true },
    }),
    getCampuses({ includeInactive: true }),
  ]);

  const countFor = (tab: string) =>
    tab === 'ALL'
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : counts.find((c) => c.status === tab)?._count._all ?? 0;

  // Approved seats per slot, so admins can see whether approving will overbook a lab.
  const approvedBySlot = new Map<string, number>();
  if (bookings.length) {
    const slots = await prisma.booking.groupBy({
      by: ['campusId', 'serviceName', 'bookingDate', 'bookingTime'],
      where: {
        status: 'APPROVED',
        OR: bookings.map(({ campusId, serviceName, bookingDate, bookingTime }) => ({
          campusId,
          serviceName,
          bookingDate,
          bookingTime,
        })),
      },
      _count: { _all: true },
    });
    for (const slot of slots) approvedBySlot.set(slotKey(slot), slot._count._all);
  }
  const capacityByLab = new Map(
    campuses.flatMap((campus) => campus.services.map((service) => [`${campus.id}|${service.name}`, service.capacity] as const)),
  );

  const hrefFor = (params: { status?: string; campus?: string }) => {
    const query = new URLSearchParams();
    const nextStatus = params.status ?? status;
    const nextCampus = 'campus' in params ? params.campus : campusFilter;
    if (nextStatus !== 'PENDING') query.set('status', nextStatus);
    if (nextCampus) query.set('campus', nextCampus);
    const qs = query.toString();
    return `/admin/bookings${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-tut-red-600">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Booking requests</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Approve or reject student lab bookings. Students are emailed when you make a decision.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800" aria-label="Filter by status">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={hrefFor({ status: tab })}
              aria-current={tab === status ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === status
                  ? 'bg-white text-tut-blue-700 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tabLabels[tab]} <span className="tabular-nums opacity-70">{countFor(tab)}</span>
            </Link>
          ))}
        </nav>

        <form className="flex items-center gap-2" action="/admin/bookings">
          {status !== 'PENDING' && <input type="hidden" name="status" value={status} />}
          <label className="text-sm font-medium" htmlFor="campus-filter">
            Campus
          </label>
          <select
            id="campus-filter"
            name="campus"
            defaultValue={campusFilter ?? ''}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All campuses</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-white dark:border-slate-700 dark:hover:bg-slate-800">
            Apply
          </button>
        </form>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          {status === 'PENDING' ? 'No booking requests are waiting for review. 🎉' : 'No bookings match this filter.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => {
            const capacity = capacityByLab.get(`${booking.campusId}|${booking.serviceName}`) ?? null;
            const approved = approvedBySlot.get(slotKey(booking)) ?? 0;
            const isPast = booking.bookingDate < today;
            const studentNumber = booking.user.email.split('@')[0];
            return (
              <li
                key={booking.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <BookingStatusBadge status={booking.status} />
                    <span className="font-semibold">{booking.serviceName}</span>
                    <span className="text-slate-500 dark:text-slate-400">· {booking.campusName}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{booking.bookingDate}</span> at <span className="font-medium">{booking.bookingTime}</span>
                    {isPast && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Date passed</span>}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {booking.user.name ?? 'Student'} · <span className="font-mono">{studentNumber}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Seats approved for this slot: {approved}
                    {capacity !== null ? ` of ${capacity}` : ' (no seat limit set)'} · Requested{' '}
                    {booking.createdAt.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {booking.reviewedAt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reviewed by {booking.reviewedBy?.name ?? booking.reviewedBy?.email ?? 'an admin'} on{' '}
                      {booking.reviewedAt.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                      {booking.adminNote && <> · “{booking.adminNote}”</>}
                    </p>
                  )}
                </div>
                {booking.status !== 'CANCELLED' && (
                  <BookingDecision
                    bookingId={booking.id}
                    status={booking.status}
                    slotFull={capacity !== null && approved >= capacity && booking.status !== 'APPROVED'}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {bookings.length === PAGE_SIZE && (
        <p className="text-center text-sm text-slate-500">Showing the first {PAGE_SIZE} bookings. Narrow the filter to see more.</p>
      )}
    </div>
  );
}
