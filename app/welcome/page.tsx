import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignOutButton } from '@/components/sign-out-button';

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-tut-red-600">TUT Labs</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome, {session.user.name ?? 'student'}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Signed in as {session.user.role} · {session.user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-xl bg-tut-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-tut-blue-800">
              Find a lab
            </Link>
            <SignOutButton className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" />
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">My bookings</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your lab workstation booking requests.</p>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">{bookings.length} booking{bookings.length === 1 ? '' : 's'}</span>
          </div>

          {bookings.length ? (
            <ul className="mt-5 space-y-3">
              {bookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <h3 className="font-semibold">{booking.campusName}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{booking.serviceName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.bookingDate} at {booking.bookingTime}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    {booking.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              You haven&apos;t booked a lab yet. Choose a campus to request your first workstation.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
