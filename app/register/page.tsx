'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { STUDENT_EMAIL_DOMAIN, isValidStudentNumber } from '@/lib/student-email';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!isValidStudentNumber(studentNumber)) {
      setMessage('Enter a valid student number without spaces or an email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, studentNumber, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? 'Registration failed.');
        return;
      }

      const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
      window.location.href =
        callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')
          ? `/login?${new URLSearchParams({ callbackUrl }).toString()}`
          : '/login';
    } catch {
      setMessage('Unable to register right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function preserveBookingSelection(event: React.MouseEvent<HTMLAnchorElement>) {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
    if (callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')) {
      event.preventDefault();
      window.location.href = `/login?${new URLSearchParams({ callbackUrl }).toString()}`;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Link href="/" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
          ← Back to home
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-tut-red-600">TUT Labs</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Student registration</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Create an account with your TUT student number.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Full name
            <input
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

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
              Your TUT email will be {studentNumber.trim() || 'student number'}@{STUDENT_EMAIL_DOMAIN}
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">At least 6 characters.</span>
          </label>

          {message && <p className="text-sm text-rose-600" role="alert">{message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-tut-red-600 px-4 py-3 font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create student account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Already registered? <Link href="/login" onClick={preserveBookingSelection} className="font-semibold text-tut-blue-700 hover:underline dark:text-tut-blue-200">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
