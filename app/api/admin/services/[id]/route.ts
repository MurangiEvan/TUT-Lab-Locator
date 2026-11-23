import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { adminApiGuard } from '@/lib/admin';
import { labStatuses, type LabStatusValue } from '@/lib/campuses';
import { prisma } from '@/lib/prisma';

// Quick status change for a single lab, used by the toggles on the admin dashboard.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const status = (body as { status?: unknown } | null)?.status;
  if (typeof status !== 'string' || !(labStatuses as readonly string[]).includes(status)) {
    return NextResponse.json({ error: `Status must be one of: ${labStatuses.join(', ')}.` }, { status: 400 });
  }

  const service = await prisma.labService.findUnique({ where: { id: params.id } });
  if (!service) return NextResponse.json({ error: 'Lab not found.' }, { status: 404 });

  const updated = await prisma.labService.update({
    where: { id: params.id },
    data: { status: status as LabStatusValue },
  });

  revalidatePath('/', 'layout');
  return NextResponse.json(updated);
}
