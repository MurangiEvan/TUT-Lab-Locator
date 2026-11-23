import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { campuses as defaultCampuses } from '../frontend/lib/campuses';

// Campus and lab data now lives in the database so admins can edit it from
// /admin. The static list in frontend/lib/campuses.ts is only used to seed an
// empty database the first time campuses are read.

export const campusProvinces = ['Gauteng', 'Mpumalanga', 'Limpopo'] as const;
export type Province = (typeof campusProvinces)[number];

export const labStatuses = ['OPEN', 'CLOSED', 'MAINTENANCE'] as const;
export type LabStatusValue = (typeof labStatuses)[number];

export type CampusWithServices = Prisma.CampusGetPayload<{ include: { services: true } }>;

const withServices = {
  services: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
} satisfies Prisma.CampusInclude;

let seedPromise: Promise<void> | null = null;

/** Seeds the default campuses once if the table is empty. Safe to call on every request. */
export function ensureCampusesSeeded() {
  seedPromise ??= seedDefaultCampuses().catch((error) => {
    seedPromise = null; // allow a retry on the next request
    throw error;
  });
  return seedPromise;
}

async function seedDefaultCampuses() {
  if ((await prisma.campus.count()) > 0) return;
  try {
    // One transaction so readers never see a half-seeded list.
    await prisma.$transaction(
      defaultCampuses.map((campus, index) =>
        prisma.campus.create({
          data: {
            id: campus.id,
            name: campus.name,
            shortName: campus.shortName,
            province: campus.province,
            city: campus.city,
            address: campus.address,
            building: campus.building,
            description: campus.description,
            hours: campus.hours,
            rating: campus.rating,
            contactEmail: campus.contactEmail,
            contactPhone: campus.contactPhone,
            sortOrder: index,
            services: {
              create: campus.services.map((service, serviceIndex) => ({
                name: service.name,
                description: service.description ?? null,
                sortOrder: serviceIndex,
              })),
            },
          },
        }),
      ),
    );
  } catch (error) {
    // Another process seeded concurrently; that's fine as long as data now exists.
    if ((await prisma.campus.count()) === 0) throw error;
  }
}

export async function getCampuses(options: { includeInactive?: boolean } = {}): Promise<CampusWithServices[]> {
  await ensureCampusesSeeded();
  return prisma.campus.findMany({
    where: options.includeInactive ? undefined : { isActive: true },
    include: withServices,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function findCampus(
  id: string,
  options: { includeInactive?: boolean } = {},
): Promise<CampusWithServices | null> {
  await ensureCampusesSeeded();
  const campus = await prisma.campus.findUnique({ where: { id }, include: withServices });
  if (!campus || (!campus.isActive && !options.includeInactive)) return null;
  return campus;
}
