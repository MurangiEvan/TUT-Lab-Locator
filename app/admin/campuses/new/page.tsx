import Link from 'next/link';

import { CampusForm } from '@/components/admin/campus-form';
import { newServiceRow, scheduleToRows } from '@/components/admin/campus-form-values';
import { parseHoursText } from '@/lib/schedule';

export default function NewCampusPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
        ← Back to dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-3xl font-bold">Add campus</h1>
      <CampusForm
        mode="create"
        initial={{
          id: '',
          name: '',
          shortName: '',
          province: 'Gauteng',
          city: '',
          address: '',
          building: '',
          description: '',
          schedule: scheduleToRows(parseHoursText('Mon–Fri 08:00–17:00, Sat–Sun closed')!),
          slotMinutes: 60,
          rating: 0,
          contactEmail: '',
          contactPhone: '',
          isActive: true,
          services: [newServiceRow()],
        }}
      />
    </div>
  );
}
