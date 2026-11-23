import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ExternalLink, LayoutDashboard, Plus } from 'lucide-react';

import { requireAdminPage } from '@/lib/admin';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b-4 border-tut-red-600 bg-tut-blue-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <Image
              src="/tut-logo.png"
              alt="TUT logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
            />
            <div className="leading-tight">
              <p className="text-base font-semibold">TUT Labs Admin</p>
              <p className="text-xs text-white/75">{session.user.name ?? session.user.email}</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
            </Link>
            <Link href="/admin/campuses/new" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-white/10">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add campus
            </Link>
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-white/10">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> View site
            </Link>
            <ThemeToggle />
            <SignOutButton className="rounded-full bg-tut-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-tut-red-700" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
