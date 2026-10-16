import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findCampus } from '@/lib/campuses';
import { LabBookingForm } from '@/components/lab-booking-form';
import { SignOutButton } from '@/components/sign-out-button';

export default async function CampusDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { service?: string | string[] };
}) {
  const campus = findCampus(params.id);
  if (!campus) notFound();

  const session = await getServerSession(authOptions);
  const requestedService = Array.isArray(searchParams?.service) ? searchParams.service[0] : searchParams?.service;
  const selectedService = campus.services.some((service) => service.name === requestedService) ? requestedService : undefined;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b-4 border-tut-red-600 bg-tut-blue-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/tut-logo.png"
              alt="TUT logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
            />
            <span className="truncate text-base font-semibold">TUT Labs</span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            {session ? (
              <>
                <Link href="/welcome" className="text-sm font-medium hover:text-white/80">My bookings</Link>
                <SignOutButton />
              </>
            ) : (
              <Link href="#book-a-lab" className="text-sm font-medium hover:text-white/80">
                Choose a lab
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="bg-tut-blue-700 py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All campuses
          </Link>
          <p className="mt-6 text-sm font-medium uppercase tracking-wider text-tut-red-200">{campus.province} Province</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold sm:text-4xl">{campus.name}</h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-tut-blue-700">
              <Star className="h-4 w-4 text-amber-500" /> {campus.rating} · Verified TUT facility
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-white/80">
            <MapPin className="h-4 w-4" /> {campus.city} · {campus.address}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">About this campus</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{campus.description}</p>
            <p className="mt-3 text-sm text-slate-500">{campus.building}</p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">Labs and services</h2>
            <ul className="mt-4 space-y-3">
              {campus.services.map((service) => (
                <li key={service.name} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <h3 className="font-medium">{service.name}</h3>
                  {service.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{service.description}</p>}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside id="book-a-lab" className="h-fit rounded-3xl border-2 border-tut-blue-700/20 bg-white p-6 shadow-sm dark:border-tut-blue-700/40 dark:bg-slate-900">
          <h2 className="text-xl font-semibold">Book a lab</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Choose a lab, date, and start time to request a workstation booking.
          </p>
          {session?.user.role === 'STUDENT' ? (
            <LabBookingForm
              campusId={campus.id}
              services={campus.services.map((service) => service.name)}
              initialServiceName={selectedService}
            />
          ) : session ? (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Lab bookings are available to student accounts. Sign in with a student account to book.
            </p>
          ) : (
            <LabBookingForm
              campusId={campus.id}
              services={campus.services.map((service) => service.name)}
              initialServiceName={selectedService}
              requiresSignIn
            />
          )}
          <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">
            Campus hours: {campus.hours}
          </p>
        </aside>
      </section>
    </main>
  );
}
