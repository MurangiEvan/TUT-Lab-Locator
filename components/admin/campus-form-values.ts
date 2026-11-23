// Shared between the server admin pages and the client CampusForm.
import { WEEK_DAYS, type WeeklySchedule } from '@/lib/schedule';

export type ServiceRow = {
  key: string;
  name: string;
  description: string;
  capacity: string;
  status: string;
};

export type CampusFormValues = {
  id: string;
  name: string;
  shortName: string;
  province: string;
  city: string;
  address: string;
  building: string;
  description: string;
  schedule: ScheduleRows;
  slotMinutes: number;
  rating: number;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  services: ServiceRow[];
};

/** Editable weekly hours, keyed by ISO weekday. Times are kept while a day is closed. */
export type ScheduleRows = Record<number, { isOpen: boolean; open: string; close: string }>;

export function scheduleToRows(schedule: WeeklySchedule): ScheduleRows {
  const rows: ScheduleRows = {};
  for (const day of WEEK_DAYS) {
    const hours = schedule[day];
    rows[day] = hours ? { isOpen: true, ...hours } : { isOpen: false, open: '08:00', close: '17:00' };
  }
  return rows;
}

export function rowsToSchedule(rows: ScheduleRows): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (const day of WEEK_DAYS) {
    const row = rows[day];
    schedule[day] = row?.isOpen ? { open: row.open, close: row.close } : null;
  }
  return schedule;
}

export function newServiceRow(partial: Partial<ServiceRow> = {}): ServiceRow {
  return {
    key: Math.random().toString(36).slice(2),
    name: '',
    description: '',
    capacity: '',
    status: 'OPEN',
    ...partial,
  };
}
