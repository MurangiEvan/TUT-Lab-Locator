'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const MIN_LENGTH = 6;

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError(`Choose a password of at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data: { error?: string } = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to reset your password.');
        return;
      }
      setDone(true);
    } catch {
      setError('Unable to reset your password. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
        <CheckCircle2 className="mb-2 h-6 w-6" aria-hidden="true" />
        <p className="font-semibold">Password updated</p>
        <p className="mt-1">You can now sign in with your new password.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-tut-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-tut-red-700"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  const inputClass =
    'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950';

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        New password
        <input
          type="password"
          autoComplete="new-password"
          autoFocus
          minLength={MIN_LENGTH}
          className={inputClass}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">At least {MIN_LENGTH} characters.</span>
      </label>

      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          className={inputClass}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </label>

      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-tut-red-600 px-4 py-3 font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Saving...' : 'Reset password'}
      </button>
    </form>
  );
}
