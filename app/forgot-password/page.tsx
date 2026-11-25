'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { MailCheck } from 'lucide-react';
import { ADMIN_EMAIL, STUDENT_EMAIL_DOMAIN, isAdminIdentifier, isEmailAddress, isValidStudentNumber } from '@/lib/student-email';

export default function ForgotPasswordPage() {
  const [studentNumber, setStudentNumber] = useState('');
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isValidStudentNumber(studentNumber) && !isAdminIdentifier(studentNumber)) {
      setError('Enter a valid student number, or your email address if you are an admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNumber }),
      });
      const data: { error?: string; message?: string } = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to send a reset link right now.');
        return;
      }
      setSentMessage(data.message ?? 'Check your TUT email for a reset link.');
    } catch {
      setError('Unable to send a reset link. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Link href="/login" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
          ← Back to sign in
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-tut-red-600">TUT Labs</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Forgot password</h1>

        {sentMessage ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
            <MailCheck className="mb-2 h-6 w-6" aria-hidden="true" />
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1">{sentMessage}</p>
            <p className="mt-3 text-emerald-800/80 dark:text-emerald-200/80">
              The link expires in 60 minutes. Didn&apos;t get it? Check your spam folder, or{' '}
              <button type="button" onClick={() => setSentMessage('')} className="font-semibold underline">
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Enter your student number (or admin email) and we&apos;ll email you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Student number or admin email
                <input
                  autoComplete="username"
                  autoFocus
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
                  value={studentNumber}
                  onChange={(event) => setStudentNumber(event.target.value)}
                  required
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Reset link goes to:{' '}
                  {isAdminIdentifier(studentNumber)
                    ? (isEmailAddress(studentNumber) ? studentNumber.trim() : ADMIN_EMAIL)
                    : `${studentNumber.trim() || 'student number'}@${STUDENT_EMAIL_DOMAIN}`}
                </span>
              </label>

              {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-tut-red-600 px-4 py-3 font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
