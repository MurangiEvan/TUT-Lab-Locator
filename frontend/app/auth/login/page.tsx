"use client";

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_EMAIL_DOMAIN, studentEmailFromNumber, isValidStudentNumber } from '@/lib/student-email';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '');
type AccountType = 'STUDENT' | 'ADMIN';

export default function LoginPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('STUDENT');
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

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: studentEmailFromNumber(studentNumber),
          password: formData.get('password'),
          role: accountType,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;
      if (!response.ok) {
        throw new Error(data?.message || 'The student number, password, or account type is incorrect.');
      }

      router.push('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.');
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
          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Use your TUT student number and account password.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Account type">
          {(['STUDENT', 'ADMIN'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              aria-pressed={accountType === type}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                accountType === type
                  ? 'bg-white text-blue-700 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {type === 'STUDENT' ? 'Student' : 'Admin'}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              Sign-in email: {studentNumber.trim() || 'student number'}@{STUDENT_EMAIL_DOMAIN}
            </p>
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Enter your password"
            />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Signing in...' : `Sign in as ${accountType === 'STUDENT' ? 'student' : 'admin'}`}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Student? <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
