import { motion } from 'framer-motion';
import Badge from '../ui/Badge';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export default function AccountCard({ account }) {
  const { _id, currency, status, createdAt } = account;

  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // Format creation date
  const created = createdAt
    ? new Date(createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  // Truncate account ID for display
  const shortId = _id ? `...${_id.slice(-8).toUpperCase()}` : '—';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-brass)] transition-colors duration-200"
      style={{ backgroundColor: 'var(--color-ink-soft)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Account</span>
          <span
            className="font-mono text-lg font-medium text-[var(--color-paper)]"
            title={_id}
          >
            {symbol} {currency}
          </span>
        </div>
        <Badge status={status} />
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)]" aria-hidden="true" />

      {/* Details */}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="eyebrow mb-1">Account ID</dt>
          <dd className="font-mono text-[var(--color-paper)] tracking-wider">{shortId}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1">Opened</dt>
          <dd className="font-mono text-[var(--color-paper)]">{created}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1">Currency</dt>
          <dd className="font-mono text-[var(--color-paper)]">{currency}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1">Status</dt>
          <dd className="font-mono text-[var(--color-paper)]">{status}</dd>
        </div>
      </dl>
    </motion.article>
  );
}
