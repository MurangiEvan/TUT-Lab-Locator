'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type LabBookingFormProps = {
  campusId: string;
  services: string[];
  initialServiceName?: string;
  requiresSignIn?: boolean;
};

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LabBookingForm({
  campusId,
  services,
  initialServiceName,
  requiresSignIn = false,
}: LabBookingFormProps) {
  const router = useRouter();
  const minimumDate = useMemo(() => localDateString(new Date()), []);
  const [serviceName, setServiceName] = useState(
    initialServiceName && services.includes(initialServiceName)
      ? initialServiceName
      : requiresSignIn ? '' : services[0] ?? '',
  );
  const [bookingDate, setBookingDate] = useState(minimumDate);
  const [bookingTime, setBookingTime] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const callbackUrl = `/labs/${campusId}?${new URLSearchParams({ service: serviceName }).toString()}`;
  const signInUrl = `/login?${new URLSearchParams({ callbackUrl }).toString()}`;
  const registerUrl = `/register?${new URLSearchParams({ callbackUrl }).toString()}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setConfirmation('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId, serviceName, bookingDate, bookingTime }),
      });
      const data: { error?: string; id?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to create your booking.');
        return;
      }

      setConfirmation('Your booking request has been submitted. You can find it in My bookings.');
      setServiceName(services[0] ?? '');
      setBookingDate(minimumDate);
      setBookingTime('');
      router.refresh();
    } catch {
      setError('Unable to submit your booking. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Lab or service
        <select
          value={serviceName}
          onChange={(event) => setServiceName(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
        >
          {requiresSignIn && <option value="">Select a lab</option>}
          {services.map((service) => <option key={service} value={service}>{service}</option>)}
        </select>
      </label>

      {requiresSignIn ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign in after choosing your lab. Your selection will be saved and ready to book.
          </p>
          <button
            type="button"
            disabled={!serviceName}
            onClick={() => router.push(signInUrl)}
            className="block w-full rounded-xl bg-tut-red-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in to continue
          </button>
          {serviceName ? (
            <p className="text-center text-sm text-slate-500">
              New student? <Link href={registerUrl} className="font-semibold text-tut-blue-700 hover:underline dark:text-tut-blue-200">Create an account</Link>
            </p>
          ) : (
            <p className="text-center text-sm text-slate-500">Select a lab above to continue.</p>
          )}
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Date
            <input
              type="date"
              min={minimumDate}
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Start time
            <input
              type="time"
              value={bookingTime}
              onChange={(event) => setBookingTime(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          {confirmation && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{confirmation}</p>}

          <button
            type="submit"
            disabled={isSubmitting || services.length === 0}
            className="w-full rounded-xl bg-tut-red-600 px-4 py-3 font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting booking...' : 'Book this lab'}
          </button>
        </>
      )}
    </form>
  );
}
