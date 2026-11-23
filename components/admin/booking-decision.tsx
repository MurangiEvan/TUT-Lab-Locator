'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

export function BookingDecision({
  bookingId,
  status,
  slotFull,
}: {
  bookingId: string;
  status: string;
  slotFull: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'' | 'APPROVED' | 'REJECTED'>('');
  const [error, setError] = useState('');

  async function decide(decision: 'APPROVED' | 'REJECTED') {
    setBusy(decision);
    setError('');
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, note }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        setError(data.error ?? 'Unable to update this booking.');
        return;
      }
      setNote('');
      router.refresh();
    } catch {
      setError('Unable to update. Check your connection and try again.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 md:w-72">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        placeholder={status === 'PENDING' ? 'Optional note to the student' : 'Optional note with change'}
        aria-label="Note to the student"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
      />
      <div className="flex gap-2">
        {status !== 'APPROVED' && (
          <button
            type="button"
            onClick={() => decide('APPROVED')}
            disabled={Boolean(busy) || slotFull}
            title={slotFull ? 'This slot is already at capacity' : undefined}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden="true" /> {busy === 'APPROVED' ? 'Approving…' : slotFull ? 'Slot full' : 'Approve'}
          </button>
        )}
        {status !== 'REJECTED' && (
          <button
            type="button"
            onClick={() => decide('REJECTED')}
            disabled={Boolean(busy)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            <X className="h-4 w-4" aria-hidden="true" /> {busy === 'REJECTED' ? 'Rejecting…' : 'Reject'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600" role="alert">{error}</p>}
    </div>
  );
}
