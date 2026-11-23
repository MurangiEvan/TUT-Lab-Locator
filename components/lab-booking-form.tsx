'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

type LabBookingFormProps = {
  campusId: string;
  services: string[];
  initialServiceName?: string;
  requiresSignIn?: boolean;
  /** ISO weekdays (1 = Mon … 7 = Sun) the campus is open. */
  openDays?: number[];
  /** Today and the last bookable date (YYYY-MM-DD, South African time), from the server. */
  today?: string;
  lastDate?: string;
};

type Slot = {
  start: string;
  end: string;
  remaining: number | null;
  state: 'available' | 'full' | 'past' | 'yours';
};

type Availability = {
  slots: Slot[];
  capacity?: number | null;
  reason?: 'closed' | 'out-of-range' | 'lab-unavailable';
};

const QUICK_DAYS = 14;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateParts(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay();
  return { weekday: WEEKDAY[day], iso: day === 0 ? 7 : day, dayOfMonth: d.getUTCDate(), month: MONTH[d.getUTCMonth()] };
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function LabBookingForm({
  campusId,
  services,
  initialServiceName,
  requiresSignIn = false,
  openDays = [1, 2, 3, 4, 5, 6, 7],
  today: serverToday,
  lastDate: serverLastDate,
}: LabBookingFormProps) {
  const router = useRouter();
  const today = useMemo(() => serverToday ?? localDateString(new Date()), [serverToday]);
  const lastDate = serverLastDate ?? addDays(today, 30);
  const quickDates = useMemo(() => Array.from({ length: QUICK_DAYS }, (_, i) => addDays(today, i)), [today]);
  const firstOpenDate = quickDates.find((date) => openDays.includes(dateParts(date).iso)) ?? today;

  const [serviceName, setServiceName] = useState(
    initialServiceName && services.includes(initialServiceName) ? initialServiceName : requiresSignIn ? '' : services[0] ?? '',
  );
  const [bookingDate, setBookingDate] = useState(firstOpenDate);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const callbackUrl = `/labs/${campusId}?${new URLSearchParams({ service: serviceName }).toString()}`;
  const signInUrl = `/login?${new URLSearchParams({ callbackUrl }).toString()}`;
  const registerUrl = `/register?${new URLSearchParams({ callbackUrl }).toString()}`;

  const loadAvailability = useCallback(
    async (signal?: AbortSignal) => {
      if (requiresSignIn || !serviceName || !bookingDate) return;
      setLoadingSlots(true);
      setSlotError('');
      try {
        const query = new URLSearchParams({ campusId, serviceName, date: bookingDate });
        const response = await fetch(`/api/availability?${query.toString()}`, { signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Unable to load time slots.');
        setAvailability(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setAvailability(null);
        setSlotError(err instanceof Error ? err.message : 'Unable to load time slots.');
      } finally {
        if (!signal?.aborted) setLoadingSlots(false);
      }
    },
    [campusId, serviceName, bookingDate, requiresSignIn],
  );

  useEffect(() => {
    setSelectedSlot(null);
    const controller = new AbortController();
    loadAvailability(controller.signal);
    return () => controller.abort();
  }, [loadAvailability]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) {
      setError('Choose a time slot.');
      return;
    }
    setError('');
    setConfirmation('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId, serviceName, bookingDate, bookingTime: selectedSlot.start }),
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to create your booking.');
        await loadAvailability(); // someone may have taken the last seat
        return;
      }

      const { weekday, dayOfMonth, month } = dateParts(bookingDate);
      setConfirmation(
        `Request sent for ${serviceName}, ${weekday} ${dayOfMonth} ${month}, ${selectedSlot.start}–${selectedSlot.end}. A lab admin will review it and you'll get an email once it's approved.`,
      );
      setSelectedSlot(null);
      await loadAvailability();
      router.refresh();
    } catch {
      setError('Unable to submit your booking. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const labSelect = (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      Lab or service
      <select
        value={serviceName}
        onChange={(event) => {
          setServiceName(event.target.value);
          setConfirmation('');
        }}
        required
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
      >
        {requiresSignIn && <option value="">Select a lab</option>}
        {services.map((service) => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
    </label>
  );

  if (requiresSignIn) {
    return (
      <div className="mt-5 space-y-4">
        {labSelect}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sign in after choosing your lab to see open time slots. Your selection will be saved.
        </p>
        <button
          type="button"
          disabled={!serviceName}
          onClick={() => router.push(signInUrl)}
          className="block w-full rounded-xl bg-tut-red-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sign in to continue
        </button>
        {serviceName ? (
          <p className="text-center text-sm text-slate-500">
            New student?{' '}
            <Link href={registerUrl} className="font-semibold text-tut-blue-700 hover:underline dark:text-tut-blue-200">
              Create an account
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-slate-500">Select a lab above to continue.</p>
        )}
      </div>
    );
  }

  const isQuickDate = quickDates.includes(bookingDate);
  const slots = availability?.slots ?? [];
  const openCount = slots.filter((slot) => slot.state === 'available').length;

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      {labSelect}

      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">Date</legend>
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="Pick a date">
          {quickDates.map((date) => {
            const { weekday, dayOfMonth, month, iso } = dateParts(date);
            const closed = !openDays.includes(iso);
            const selected = date === bookingDate;
            return (
              <button
                key={date}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${weekday} ${dayOfMonth} ${month}${closed ? ', closed' : ''}`}
                disabled={closed}
                onClick={() => {
                  setBookingDate(date);
                  setConfirmation('');
                }}
                className={`flex w-14 shrink-0 flex-col items-center rounded-xl border px-1 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected
                    ? 'border-tut-red-600 bg-tut-red-600 text-white shadow'
                    : 'border-slate-200 bg-white hover:border-tut-red-600 dark:border-slate-700 dark:bg-slate-950'
                }`}
              >
                <span className="font-medium">{date === today ? 'Today' : weekday}</span>
                <span className="text-lg font-bold leading-tight">{dayOfMonth}</span>
                <span className={selected ? 'text-white/80' : 'text-slate-500'}>{closed ? 'Closed' : month}</span>
              </button>
            );
          })}
        </div>
        <label className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Other date:
          <input
            type="date"
            min={today}
            max={lastDate}
            value={isQuickDate ? '' : bookingDate}
            onChange={(event) => {
              if (event.target.value) setBookingDate(event.target.value);
              setConfirmation('');
            }}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend className="flex w-full items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
          <span>Time slot</span>
          {!loadingSlots && slots.length > 0 && (
            <span className="text-xs font-normal text-slate-500">
              {openCount} of {slots.length} available
            </span>
          )}
        </legend>

        {loadingSlots && !availability ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy="true" aria-label="Loading time slots">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : slotError ? (
          <p className="mt-2 text-sm text-rose-600" role="alert">
            {slotError}{' '}
            <button type="button" onClick={() => loadAvailability()} className="font-semibold underline">
              Retry
            </button>
          </p>
        ) : slots.length === 0 ? (
          <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {availability?.reason === 'lab-unavailable'
              ? 'This lab is not taking bookings right now.'
              : availability?.reason === 'out-of-range'
                ? 'Choose a date within the booking window.'
                : 'The campus is closed on this day. Pick another date.'}
          </p>
        ) : (
          <div
            className={`mt-2 grid grid-cols-2 gap-2 transition-opacity sm:grid-cols-3 ${loadingSlots ? 'opacity-60' : ''}`}
            role="radiogroup"
            aria-label="Pick a time slot"
          >
            {slots.map((slot) => {
              const selected = selectedSlot?.start === slot.start;
              const disabled = slot.state !== 'available';
              const detail =
                slot.state === 'yours'
                  ? 'Your booking'
                  : slot.state === 'past'
                    ? 'Passed'
                    : slot.state === 'full'
                      ? 'Full'
                      : slot.remaining === null
                        ? 'Available'
                        : `${slot.remaining} seat${slot.remaining === 1 ? '' : 's'} left`;
              // Highlight scarce slots: a quarter of the seats or fewer left.
              const low =
                slot.state === 'available' &&
                slot.remaining !== null &&
                availability?.capacity != null &&
                slot.remaining < availability.capacity &&
                slot.remaining <= Math.max(1, Math.floor(availability.capacity / 4));
              return (
                <button
                  key={slot.start}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setError('');
                  }}
                  className={`rounded-xl border px-2 py-2 text-left transition disabled:cursor-not-allowed ${
                    selected
                      ? 'border-tut-red-600 bg-tut-red-600 text-white shadow'
                      : slot.state === 'yours'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : disabled
                          ? 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
                          : 'border-slate-200 bg-white hover:border-tut-red-600 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <span className="block text-sm font-semibold tabular-nums">
                    {slot.start}–{slot.end}
                  </span>
                  <span
                    className={`block text-xs ${
                      selected ? 'text-white/85' : low ? 'font-semibold text-amber-600 dark:text-amber-400' : ''
                    }`}
                  >
                    {detail}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {confirmation && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {confirmation}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !selectedSlot}
        className="w-full rounded-xl bg-tut-red-600 px-4 py-3 font-semibold text-white transition hover:bg-tut-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? 'Submitting booking...'
          : selectedSlot
            ? `Request ${selectedSlot.start}–${selectedSlot.end}`
            : 'Choose a time slot'}
      </button>
    </form>
  );
}
