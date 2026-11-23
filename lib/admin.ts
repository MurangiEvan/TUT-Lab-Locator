import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';

/** For admin pages: redirects anyone who is not a signed-in admin. */
export async function requireAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/welcome');
  return session;
}

/** For admin API routes: returns an error response, or null when allowed. */
export async function adminApiGuard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in as an admin to continue.' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage lab information.' }, { status: 403 });
  }
  return null;
}
