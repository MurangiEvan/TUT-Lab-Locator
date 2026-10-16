import Link from 'next/link';
import { campuses, campusProvinces } from '@/lib/campuses';

export default function LabsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
          ← Back to home
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-tut-red-600">TUT Labs</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Browse campuses</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Select a campus to view its labs and book a workstation.</p>

        <div className="mt-8 space-y-10">
          {campusProvinces.map((province) => {
            const provinceCampuses = campuses.filter((campus) => campus.province === province);
            return (
              <section key={province}>
                <h2 className="mb-4 text-xl font-semibold">{province}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {provinceCampuses.map((campus) => (
                    <Link
                      key={campus.id}
                      href={`/labs/${campus.id}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-tut-red-600 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                      <h3 className="text-lg font-semibold">{campus.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{campus.city}</p>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{campus.description}</p>
                      <p className="mt-4 text-sm font-semibold text-tut-red-700 dark:text-tut-red-300">View labs and book →</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
