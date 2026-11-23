'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { newServiceRow, type CampusFormValues, type ServiceRow } from './campus-form-values';

const PROVINCES = ['Gauteng', 'Mpumalanga', 'Limpopo'];

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-tut-blue-600 focus:ring-2 focus:ring-tut-blue-600/20 dark:border-slate-700 dark:bg-slate-950';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function CampusForm({ mode, initial }: { mode: 'create' | 'edit'; initial: CampusFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof CampusFormValues>(key: K, value: CampusFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved('');
  }

  function setService(index: number, patch: Partial<ServiceRow>) {
    setValues((current) => ({
      ...current,
      services: current.services.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
    setSaved('');
  }

  function moveService(index: number, direction: -1 | 1) {
    setValues((current) => {
      const services = [...current.services];
      const target = index + direction;
      if (target < 0 || target >= services.length) return current;
      [services[index], services[target]] = [services[target], services[index]];
      return { ...current, services };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaved('');
    setSaving(true);

    const payload = {
      ...values,
      services: values.services.map(({ name, description, capacity, status }) => ({
        name,
        description,
        capacity: capacity === '' ? null : Number(capacity),
        status,
      })),
    };

    try {
      const response = await fetch(mode === 'create' ? '/api/admin/campuses' : `/api/admin/campuses/${values.id}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: { error?: string } = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to save this campus.');
        return;
      }
      if (mode === 'create') {
        router.push(`/admin/campuses/${values.id}?created=1`);
      } else {
        setSaved('Changes saved and published.');
      }
      router.refresh();
    } catch {
      setError('Unable to save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${values.name} and all of its labs? Existing bookings are kept. This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/campuses/${values.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        setError(data.error ?? 'Unable to delete this campus.');
        return;
      }
      router.push('/admin');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-semibold">Campus details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Campus name
            <input
              className={inputClass}
              value={values.name}
              onChange={(event) => {
                set('name', event.target.value);
                if (!slugTouched) set('id', slugify(event.target.value.replace(/\bcampus\b/i, '')));
              }}
              required
            />
          </label>
          <label className={labelClass}>
            Short name
            <input className={inputClass} value={values.shortName} onChange={(e) => set('shortName', e.target.value)} required />
          </label>
          <label className={labelClass}>
            URL slug
            <input
              className={`${inputClass} font-mono disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800`}
              value={values.id}
              onChange={(event) => {
                setSlugTouched(true);
                set('id', event.target.value.toLowerCase());
              }}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              disabled={mode === 'edit'}
              required
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {mode === 'edit' ? 'The page address cannot change after creation.' : `Page address: /labs/${values.id || '…'}`}
            </span>
          </label>
          <label className={labelClass}>
            Province
            <select className={inputClass} value={values.province} onChange={(e) => set('province', e.target.value)}>
              {PROVINCES.map((province) => (
                <option key={province}>{province}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            City
            <input className={inputClass} value={values.city} onChange={(e) => set('city', e.target.value)} required />
          </label>
          <label className={labelClass}>
            Building
            <input className={inputClass} value={values.building} onChange={(e) => set('building', e.target.value)} required />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Address
            <input className={inputClass} value={values.address} onChange={(e) => set('address', e.target.value)} required />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea
              className={`${inputClass} min-h-24`}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              required
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Opening hours
            <input className={inputClass} value={values.hours} onChange={(e) => set('hours', e.target.value)} required />
          </label>
          <label className={labelClass}>
            Contact email
            <input type="email" className={inputClass} value={values.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} required />
          </label>
          <label className={labelClass}>
            Contact phone
            <input type="tel" className={inputClass} value={values.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} required />
          </label>
          <label className={labelClass}>
            Rating (0–5)
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className={inputClass}
              value={values.rating}
              onChange={(e) => set('rating', Number(e.target.value))}
              required
            />
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium dark:border-slate-800">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="h-4 w-4 accent-tut-red-600"
            />
            Visible on the public site
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Labs and services</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Only labs marked Open can be booked by students.</p>
          </div>
          <button
            type="button"
            onClick={() => set('services', [...values.services, newServiceRow()])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add lab
          </button>
        </div>

        <ol className="mt-4 space-y-3">
          {values.services.map((service, index) => (
            <li key={service.key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem_9rem]">
                <label className={labelClass}>
                  Lab name
                  <input className={inputClass} value={service.name} onChange={(e) => setService(index, { name: e.target.value })} required />
                </label>
                <label className={labelClass}>
                  Seats
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={service.capacity}
                    onChange={(e) => setService(index, { capacity: e.target.value })}
                    placeholder="—"
                  />
                </label>
                <label className={labelClass}>
                  Status
                  <select className={inputClass} value={service.status} onChange={(e) => setService(index, { status: e.target.value })}>
                    <option value="OPEN">Open</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-3`}>
                  Description
                  <input
                    className={inputClass}
                    value={service.description}
                    onChange={(e) => setService(index, { description: e.target.value })}
                    placeholder="Optional, e.g. software installed or access rules"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <IconButton label="Move up" onClick={() => moveService(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton label="Move down" onClick={() => moveService(index, 1)} disabled={index === values.services.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Remove ${service.name || 'lab'}`}
                  onClick={() => set('services', values.services.filter((_, i) => i !== index))}
                  disabled={values.services.length === 1}
                  danger
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:mx-0 sm:rounded-2xl sm:border">
        <div className="min-h-5 text-sm">
          {error && <p className="text-rose-600" role="alert">{error}</p>}
          {saved && <p className="text-emerald-700 dark:text-emerald-400" role="status">{saved}</p>}
        </div>
        <div className="flex gap-2">
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              {deleting ? 'Deleting…' : 'Delete campus'}
            </button>
          )}
          <button
            type="submit"
            disabled={saving || deleting}
            className="rounded-xl bg-tut-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tut-red-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create campus' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 transition disabled:opacity-30 ${
        danger ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
