"use client";

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_EMAIL_DOMAIN, isValidStudentNumber, studentEmailFromNumber } from '@/lib/student-email';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '');

export default function RegisterPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isValidStudentNumber(studentNumber)) {
      setError('Enter a valid student number without spaces or an email address.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      if (!API_URL) {
        throw new Error('The API URL is not configured for this deployment.');
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullname: formData.get('fullname'),
          email: studentEmailFromNumber(studentNumber),
          password: formData.get('password'),
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;
      if (!response.ok) {
        throw new Error(data?.message || 'The account could not be created.');
      }

      router.push('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">← Back to home</Link>
        <div className="mt-7 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-700">TUT Labs</p>
          <h1 className="text-3xl font-semibold">Student registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Register with your TUT student number.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullname" className="mb-2 block text-sm font-medium">Full name</label>
            <input
              id="fullname"
              name="fullname"
              autoComplete="name"
              required
              minLength={2}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label htmlFor="studentNumber" className="mb-2 block text-sm font-medium">Student number</label>
            <input
              id="studentNumber"
              name="studentNumber"
              autoComplete="username"
              required
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            <p className="mt-1 text-xs text-slate-500">
              Your account email will be {studentNumber.trim() || 'student number'}@{STUDENT_EMAIL_DOMAIN}
            </p>
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
              placeholder="At least 6 characters"
            />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Creating account...' : 'Create student account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
