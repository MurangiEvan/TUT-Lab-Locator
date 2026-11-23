const styles: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  CLOSED: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  MAINTENANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
};

const labels: Record<string, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  MAINTENANCE: 'Maintenance',
};

export function LabStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.CLOSED}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] ?? status}
    </span>
  );
}
