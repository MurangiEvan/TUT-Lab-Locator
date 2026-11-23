import Link from 'next/link';

import { ResetPasswordForm } from '@/components/reset-password-form';
import { findValidResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { token?: string | string[] };
}) {
  const token = Array.isArray(searchParams?.token) ? searchParams.token[0] : searchParams?.token;
  const isValid = token ? Boolean(await findValidResetToken(token)) : false;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Link href="/login" className="text-sm font-medium text-tut-blue-700 hover:underline dark:text-tut-blue-200">
          ← Back to sign in
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-tut-red-600">TUT Labs</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Choose a new password</h1>

        {isValid && token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="mt-6 rounded-2xl bg-rose-50 p-5 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
            <p className="font-semibold">This reset link is invalid or has expired.</p>
            <p className="mt-1">Reset links work once and expire after 60 minutes.</p>
            <Link href="/forgot-password" className="mt-3 inline-block font-semibold underline">
              Request a new link
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
