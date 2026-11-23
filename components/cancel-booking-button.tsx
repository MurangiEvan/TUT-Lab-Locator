'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function cancel() {
    if (!window.confirm('Cancel this booking? This frees your seat for other students.')) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        setError(data.error ?? 'Unable to cancel.');
        return;
      }
      router.refresh();
    } catch {
      setError('Unable to cancel. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        onClick={cancel}
        disabled={busy}
        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
      >
        {busy ? 'Cancelling…' : 'Cancel'}
      </button>
      {error && <span className="mt-1 text-xs text-rose-600" role="alert">{error}</span>}
    </span>
  );
}
