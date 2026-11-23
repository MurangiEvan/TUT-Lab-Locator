import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import { CampusForm } from '@/components/admin/campus-form';
import { newServiceRow, scheduleToRows } from '@/components/admin/campus-form-values';
import { getCampusSchedule } from '@/lib/schedule';
import { findCampus } from '@/lib/campuses';

export default async function EditCampusPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { created?: string };
}) {
  const campus = await findCampus(params.id, { includeInactive: true });
  if (!campus) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
        ← Back to dashboard
      </Link>
      <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{campus.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Last updated {campus.updatedAt.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        {campus.isActive && (
          <Link
            href={`/labs/${campus.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200"
          >
            View public page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {searchParams?.created && (
        <p className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
          Campus created and published.
        </p>
      )}

      <CampusForm
        mode="edit"
        initial={{
          id: campus.id,
          name: campus.name,
          shortName: campus.shortName,
          province: campus.province,
          city: campus.city,
          address: campus.address,
          building: campus.building,
          description: campus.description,
          schedule: scheduleToRows(getCampusSchedule(campus)),
          slotMinutes: campus.slotMinutes,
          rating: campus.rating,
          contactEmail: campus.contactEmail,
          contactPhone: campus.contactPhone,
          isActive: campus.isActive,
          services: campus.services.map((service) =>
            newServiceRow({
              key: service.id,
              name: service.name,
              description: service.description ?? '',
              capacity: service.capacity == null ? '' : String(service.capacity),
              status: service.status,
            }),
          ),
        }}
      />
    </div>
  );
}
