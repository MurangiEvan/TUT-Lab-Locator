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
  const result = await requireAdminApi();
  return 'denied' in result ? result.denied : null;
}

/** For admin API routes that also need the admin's identity. */
export async function requireAdminApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { denied: NextResponse.json({ error: 'Sign in as an admin to continue.' }, { status: 401 }) };
  }
  if (session.user.role !== 'ADMIN') {
    return { denied: NextResponse.json({ error: 'Only admins can do this.' }, { status: 403 }) };
  }
  return { session };
}
