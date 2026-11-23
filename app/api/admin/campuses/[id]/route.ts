import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { adminApiGuard } from '@/lib/admin';
import { parseCampusInput } from '@/lib/campus-validation';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  // The slug is the campus's permanent URL and is referenced by bookings, so it cannot change.
  const parsed = parseCampusInput({ ...(body as object), id: params.id });
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { services, id, ...campus } = parsed.data;

  const existing = await prisma.campus.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Campus not found.' }, { status: 404 });

  // Replace the lab list wholesale: simpler than diffing, and avoids unique-name
  // clashes when labs are renamed or reordered. Nothing references lab ids.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.labService.deleteMany({ where: { campusId: id } });
    return tx.campus.update({
      where: { id },
      data: {
        ...campus,
        services: { create: services.map((service, index) => ({ ...service, sortOrder: index })) },
      },
      include: { services: { orderBy: { sortOrder: 'asc' } } },
    });
  });

  revalidatePath('/', 'layout');
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const existing = await prisma.campus.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Campus not found.' }, { status: 404 });
  if ((await prisma.campus.count()) <= 1) {
    // An empty table is re-seeded with the default campuses, so keep at least one.
    return NextResponse.json(
      { error: 'At least one campus must remain. Untick "Visible on the public site" to hide it instead.' },
      { status: 409 },
    );
  }

  await prisma.campus.delete({ where: { id: params.id } });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
