import Link from 'next/link';
import { Building2, CalendarClock, MonitorCheck, Pencil, Users, Wrench } from 'lucide-react';

import { LabStatusSelect } from '@/components/admin/lab-status-select';
import { campusProvinces, getCampuses } from '@/lib/campuses';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  const [campuses, pendingBookings, studentCount] = await Promise.all([
    getCampuses({ includeInactive: true }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
  ]);

  const labs = campuses.flatMap((campus) => campus.services);
  const openLabs = labs.filter((lab) => lab.status === 'OPEN').length;
  const maintenanceLabs = labs.filter((lab) => lab.status === 'MAINTENANCE').length;

  const stats = [
    { label: 'Active campuses', value: `${campuses.filter((c) => c.isActive).length} / ${campuses.length}`, icon: Building2 },
    { label: 'Labs open', value: `${openLabs} / ${labs.length}`, icon: MonitorCheck },
    { label: 'In maintenance', value: maintenanceLabs, icon: Wrench },
    { label: 'Pending bookings', value: pendingBookings, icon: CalendarClock, href: '/admin/bookings' },
    { label: 'Registered students', value: studentCount, icon: Users },
  ];

  const otherProvinceCampuses = campuses.filter((c) => !(campusProvinces as readonly string[]).includes(c.province));
  const groups = [
    ...campusProvinces.map((province) => ({ province, items: campuses.filter((c) => c.province === province) })),
    ...(otherProvinceCampuses.length ? [{ province: 'Other', items: otherProvinceCampuses }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-tut-red-600">Admin</p>
          <h1 className="mt-1 text-3xl font-bold">Lab information</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Update campus details and lab availability. Changes appear on the public site immediately.
          </p>
        </div>
        <Link
          href="/admin/campuses/new"
          className="rounded-xl bg-tut-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-tut-red-700"
        >
          Add campus
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <div
            key={label}
            className="relative rounded-2xl border border-slate-200 bg-white p-4 transition has-[a:hover]:border-tut-red-600 dark:border-slate-800 dark:bg-slate-900"
          >
            <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Icon className="h-4 w-4 text-tut-blue-600 dark:text-tut-blue-200" aria-hidden="true" />
              {href ? (
                <Link href={href} className="after:absolute after:inset-0 hover:underline">
                  {label}
                </Link>
              ) : (
                label
              )}
            </dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {groups.map(({ province, items }) =>
        items.length === 0 ? null : (
          <section key={province}>
            <h2 className="mb-3 text-lg font-semibold">{province}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((campus) => (
                <article
                  key={campus.id}
                  className={`rounded-2xl border bg-white p-5 dark:bg-slate-900 ${
                    campus.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 opacity-75 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">{campus.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {campus.city} · /labs/{campus.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!campus.isActive && (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          Hidden
                        </span>
                      )}
                      <Link
                        href={`/admin/campuses/${campus.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </Link>
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                    {campus.services.map((service) => (
                      <li key={service.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{service.name}</p>
                          {service.capacity != null && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{service.capacity} workstations</p>
                          )}
                        </div>
                        <LabStatusSelect serviceId={service.id} serviceName={service.name} initialStatus={service.status} />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
