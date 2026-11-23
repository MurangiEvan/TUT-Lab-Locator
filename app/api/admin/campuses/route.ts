import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { adminApiGuard } from '@/lib/admin';
import { parseCampusInput } from '@/lib/campus-validation';
import { ensureCampusesSeeded } from '@/lib/campuses';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = parseCampusInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { services, ...campus } = parsed.data;

  await ensureCampusesSeeded();
  if (await prisma.campus.findUnique({ where: { id: campus.id } })) {
    return NextResponse.json({ error: `A campus with the slug "${campus.id}" already exists.` }, { status: 409 });
  }

  const maxOrder = await prisma.campus.aggregate({ _max: { sortOrder: true } });
  const created = await prisma.campus.create({
    data: {
      ...campus,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      services: { create: services.map((service, index) => ({ ...service, sortOrder: index })) },
    },
  });

  revalidatePath('/', 'layout');
  return NextResponse.json(created, { status: 201 });
}
