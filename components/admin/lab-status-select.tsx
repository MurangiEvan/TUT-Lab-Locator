'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const options = [
  { value: 'OPEN', label: 'Open', className: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' },
  { value: 'MAINTENANCE', label: 'Maintenance', className: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200' },
  { value: 'CLOSED', label: 'Closed', className: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200' },
];

export function LabStatusSelect({
  serviceId,
  serviceName,
  initialStatus,
}: {
  serviceId: string;
  serviceName: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function update(next: string) {
    const previous = status;
    setStatus(next);
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Update failed');
      }
      router.refresh();
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  const current = options.find((option) => option.value === status) ?? options[2];

  return (
    <div className="flex shrink-0 flex-col items-end">
      <select
        aria-label={`Status of ${serviceName}`}
        value={status}
        disabled={saving}
        onChange={(event) => update(event.target.value)}
        className={`rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-60 ${current.className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 text-xs text-rose-600" role="alert">{error}</span>}
    </div>
  );
}
