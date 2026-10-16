'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { campuses } from '@/lib/campuses';
import { STUDENT_EMAIL_DOMAIN } from '@/lib/student-email';

type AccountType = 'STUDENT' | 'ADMIN';
type BookingSelection = {
  callbackUrl: string;
  campusName: string;
  serviceName: string;
};

export default function LoginPage() {
  const [accountType, setAccountType] = useState<AccountType>('STUDENT');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSelection, setBookingSelection] = useState<BookingSelection | null>(null);

  useEffect(() => {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
    if (!callbackUrl?.startsWith('/') || callbackUrl.startsWith('//')) return;

    const destination = new URL(callbackUrl, window.location.origin);
    if (destination.origin !== window.location.origin) return;

    const campusId = destination.pathname.match(/^\/labs\/([^/]+)$/)?.[1];
    const serviceName = destination.searchParams.get('service');
    const campus = campuses.find((item) => item.id === campusId);
    if (!campus || !serviceName || !campus.services.some((service) => service.name === serviceName)) return;

    setBookingSelection({ callbackUrl, campusName: campus.name, serviceName });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (accountType === 'STUDENT' && !bookingSelection) {
      setError('Choose your campus and lab before signing in to book.');
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        studentNumber,
        password,
        role: accountType,
        redirect: false,
      });

      if (result?.error) {
        setError('The student number or password is incorrect, or this account cannot sign in as the selected role.');
        return;
      }

      const callbackUrl = bookingSelection?.callbackUrl;
      window.location.href =
        callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/welcome';
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function preserveBookingSelection(event: React.MouseEvent<HTMLAnchorElement>) {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
    if (callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')) {
      event.preventDefault();
      window.location.href = `/register?${new URLSearchParams({ callbackUrl }).toString()}`;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Link href="/" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
          ← Back to home
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-tut-red-600">TUT Labs</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Use your TUT student number and account password.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Account type">
          {(['STUDENT', 'ADMIN'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              aria-pressed={accountType === type}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                accountType === type
                  ? 'bg-white text-tut-blue-700 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {type === 'STUDENT' ? 'Student' : 'Admin'}
            </button>
          ))}
        </div>

        {accountType === 'STUDENT' && !bookingSelection && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" role="status">
            <p className="font-semibold">Choose your lab before signing in.</p>
            <p className="mt-1">First select a campus location and the lab you want to book.</p>
            <Link href="/labs" className="mt-2 inline-block font-semibold underline">
              Browse campuses and choose a lab
            </Link>
          </div>
        )}
        {accountType === 'STUDENT' && bookingSelection && (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
            Selected: {bookingSelection.campusName} · {bookingSelection.serviceName}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Student number
            <input
              autoComplete="username"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              required
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Sign-in email: {studentNumber.trim() || 'student number'}@{STUDENT_EMAIL_DOMAIN}
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || (accountType === 'STUDENT' && !bookingSelection)}
            className="w-full rounded-xl bg-tut-red-600 px-4 py-3 font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : `Sign in as ${accountType === 'STUDENT' ? 'student' : 'admin'}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Student? {bookingSelection ? (
            <Link href="/register" onClick={preserveBookingSelection} className="font-semibold text-tut-blue-700 hover:underline dark:text-tut-blue-200">Create an account</Link>
          ) : (
            <Link href="/labs" className="font-semibold text-tut-blue-700 hover:underline dark:text-tut-blue-200">Choose a campus and lab first</Link>
          )}
        </p>
      </section>
    </main>
  );
}
