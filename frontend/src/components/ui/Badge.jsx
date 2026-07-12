const statusConfig = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-[var(--color-ledger)] text-[#4ade80]',
    dot: 'bg-[#4ade80]',
  },
  FROZEN: {
    label: 'Frozen',
    bg: 'bg-[#1a2d4a] text-[#93c5fd]',
    dot: 'bg-[#93c5fd]',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-[#2d1515] text-[var(--color-debit-light)]',
    dot: 'bg-[var(--color-debit-light)]',
  },
};

const defaultConfig = {
  label: 'Unknown',
  bg: 'bg-[var(--color-border)] text-[var(--color-slate-light)]',
  dot: 'bg-[var(--color-slate-light)]',
};

export default function Badge({ status }) {
  const config = statusConfig[status] ?? defaultConfig;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'rounded-full text-xs font-medium font-[var(--font-mono)]',
        'uppercase tracking-wider',
        config.bg,
      ].join(' ')}
    >
      <span
        className={['w-1.5 h-1.5 rounded-full shrink-0', config.dot].join(' ')}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
