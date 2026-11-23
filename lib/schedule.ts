// Weekly opening hours and booking slots. Pure functions, safe on client and server.
// Days use ISO numbering: 1 = Monday … 7 = Sunday.

export type DayHours = { open: string; close: string };
export type WeeklySchedule = Record<number, DayHours | null>;

export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const DAY_SHORT: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };
export const SLOT_LENGTHS = [30, 60, 90, 120] as const;
export const DEFAULT_SLOT_MINUTES = 60;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_SCHEDULE: WeeklySchedule = {
  1: { open: '08:00', close: '17:00' },
  2: { open: '08:00', close: '17:00' },
  3: { open: '08:00', close: '17:00' },
  4: { open: '08:00', close: '17:00' },
  5: { open: '08:00', close: '17:00' },
  6: null,
  7: null,
};

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME.test(value);
}

export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** ISO weekday (1 = Mon … 7 = Sun) of a YYYY-MM-DD date. */
export function isoWeekday(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Parses free-text hours such as "Mon–Fri 07:30–22:00, Sat 08:00–13:00, Sun closed".
 * Returns null when the text can't be understood.
 */
export function parseHoursText(text: string): WeeklySchedule | null {
  const index: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
  const schedule: WeeklySchedule = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null };
  let matched = false;

  for (const part of text.split(/[,;]/)) {
    const m = part
      .trim()
      .toLowerCase()
      .match(/^(mon|tue|wed|thu|fri|sat|sun)\w*(?:\s*[–-]\s*(mon|tue|wed|thu|fri|sat|sun)\w*)?\s+(?:(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})|closed)$/);
    if (!m) continue;
    const from = index[m[1]];
    const to = m[2] ? index[m[2]] : from;
    const hours = m[3] && m[4] ? { open: m[3].padStart(5, '0'), close: m[4].padStart(5, '0') } : null;
    if (hours && (!isTime(hours.open) || !isTime(hours.close) || toMinutes(hours.close) <= toMinutes(hours.open))) continue;
    for (let d = from; d <= to; d++) schedule[d] = hours;
    matched = true;
  }
  return matched ? schedule : null;
}

/** Validates an untrusted schedule object. Returns null if invalid. */
export function normalizeSchedule(value: unknown): WeeklySchedule | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const schedule: WeeklySchedule = {};
  for (const day of WEEK_DAYS) {
    const entry = raw[day];
    if (entry === null || entry === undefined) {
      schedule[day] = null;
      continue;
    }
    const { open, close } = entry as Record<string, unknown>;
    if (!isTime(open) || !isTime(close) || toMinutes(close) <= toMinutes(open)) return null;
    schedule[day] = { open, close };
  }
  return schedule;
}

/** The campus's schedule: stored JSON if set, else parsed from its hours text, else a default. */
export function getCampusSchedule(campus: { schedule: string; hours: string }): WeeklySchedule {
  if (campus.schedule) {
    try {
      const parsed = normalizeSchedule(JSON.parse(campus.schedule));
      if (parsed) return parsed;
    } catch {
      // fall through
    }
  }
  return parseHoursText(campus.hours) ?? DEFAULT_SCHEDULE;
}

/** Human-readable summary, grouping consecutive days with the same hours. */
export function formatSchedule(schedule: WeeklySchedule) {
  const label = (h: DayHours | null) => (h ? `${h.open}–${h.close}` : 'closed');
  const parts: string[] = [];
  let start = 1;
  for (let day = 2; day <= 8; day++) {
    if (day <= 7 && label(schedule[day]) === label(schedule[start])) continue;
    const end = day - 1;
    const days = start === end ? DAY_SHORT[start] : `${DAY_SHORT[start]}–${DAY_SHORT[end]}`;
    parts.push(`${days} ${label(schedule[start])}`);
    start = day;
  }
  return parts.join(', ');
}

/** Start times of every bookable slot on a date. A slot must finish by closing time. */
export function slotsForDate(schedule: WeeklySchedule, date: string, slotMinutes: number) {
  const hours = schedule[isoWeekday(date)];
  if (!hours) return [];
  const slots: string[] = [];
  const close = toMinutes(hours.close);
  for (let t = toMinutes(hours.open); t + slotMinutes <= close; t += slotMinutes) slots.push(fromMinutes(t));
  return slots;
}

export function slotEnd(start: string, slotMinutes: number) {
  return fromMinutes(toMinutes(start) + slotMinutes);
}
