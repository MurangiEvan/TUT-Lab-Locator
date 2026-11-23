import { campusProvinces, labStatuses, type LabStatusValue } from '@/lib/campuses';
import { formatSchedule, normalizeSchedule, SLOT_LENGTHS, WEEK_DAYS } from '@/lib/schedule';

export type ServiceInput = {
  name: string;
  description: string | null;
  capacity: number | null;
  status: LabStatusValue;
};

export type CampusInput = {
  id: string;
  name: string;
  shortName: string;
  province: string;
  city: string;
  address: string;
  building: string;
  description: string;
  hours: string;
  schedule: string;
  slotMinutes: number;
  rating: number;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  services: ServiceInput[];
};

export const CAMPUS_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredText = [
  ['name', 'Campus name'],
  ['shortName', 'Short name'],
  ['city', 'City'],
  ['address', 'Address'],
  ['building', 'Building'],
  ['description', 'Description'],
  ['contactEmail', 'Contact email'],
  ['contactPhone', 'Contact phone'],
] as const;

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Validates an admin campus payload. Returns either the clean data or an error message. */
export function parseCampusInput(body: unknown): { data: CampusInput } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Campus details are required.' };
  const raw = body as Record<string, unknown>;

  const id = text(raw.id, 60).toLowerCase();
  if (!CAMPUS_SLUG_PATTERN.test(id)) {
    return { error: 'The URL slug may only contain lowercase letters, numbers, and single hyphens (e.g. "soshanguve-south").' };
  }

  const fields: Record<string, string> = {};
  for (const [key, label] of requiredText) {
    const value = text(raw[key], key === 'description' ? 2000 : 300);
    if (!value) return { error: `${label} is required.` };
    fields[key] = value;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contactEmail)) {
    return { error: 'Enter a valid contact email address.' };
  }

  const province = text(raw.province);
  if (!(campusProvinces as readonly string[]).includes(province)) {
    return { error: `Province must be one of: ${campusProvinces.join(', ')}.` };
  }

  const schedule = normalizeSchedule(raw.schedule);
  if (!schedule) {
    return { error: 'Check the opening hours: each open day needs an opening time before its closing time.' };
  }
  if (WEEK_DAYS.every((day) => schedule[day] === null)) {
    return { error: 'The campus must be open on at least one day.' };
  }

  const slotMinutes = Number(raw.slotMinutes);
  if (!(SLOT_LENGTHS as readonly number[]).includes(slotMinutes)) {
    return { error: `Booking slot length must be one of: ${SLOT_LENGTHS.join(', ')} minutes.` };
  }

  const rating = Number(raw.rating);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return { error: 'Rating must be a number between 0 and 5.' };
  }

  if (!Array.isArray(raw.services)) return { error: 'Add at least one lab or service.' };
  const services: ServiceInput[] = [];
  const seen = new Set<string>();
  for (const item of raw.services) {
    const service = (item ?? {}) as Record<string, unknown>;
    const name = text(service.name, 120);
    if (!name) return { error: 'Every lab needs a name.' };
    if (seen.has(name.toLowerCase())) return { error: `There are two labs named "${name}". Lab names must be unique per campus.` };
    seen.add(name.toLowerCase());

    const status = text(service.status) || 'OPEN';
    if (!(labStatuses as readonly string[]).includes(status)) return { error: `Invalid status for ${name}.` };

    let capacity: number | null = null;
    if (service.capacity !== null && service.capacity !== undefined && service.capacity !== '') {
      capacity = Number(service.capacity);
      if (!Number.isInteger(capacity) || capacity < 0 || capacity > 10000) {
        return { error: `Capacity for ${name} must be a whole number.` };
      }
    }

    services.push({
      name,
      description: text(service.description, 500) || null,
      capacity,
      status: status as LabStatusValue,
    });
  }
  if (services.length === 0) return { error: 'Add at least one lab or service.' };

  return {
    data: {
      id,
      name: fields.name,
      shortName: fields.shortName,
      province,
      city: fields.city,
      address: fields.address,
      building: fields.building,
      description: fields.description,
      hours: formatSchedule(schedule),
      schedule: JSON.stringify(schedule),
      slotMinutes,
      rating: Math.round(rating * 10) / 10,
      contactEmail: fields.contactEmail,
      contactPhone: fields.contactPhone,
      isActive: raw.isActive !== false,
      services,
    },
  };
}
