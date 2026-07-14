import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Snowflake, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Badge from '../ui/Badge';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const ACCOUNT_ACCENTS = {
  SAVINGS: {
    borderColor: 'rgba(31,77,61,0.6)',
    hoverBorder: 'rgba(31,77,61,1)',
    accentBg: 'rgba(23,57,46,0.15)',
    label: 'SAVINGS',
    labelColor: '#4ade80',
  },
  CURRENT: {
    borderColor: 'rgba(182,141,64,0.4)',
    hoverBorder: 'var(--color-brass)',
    accentBg: 'rgba(182,141,64,0.07)',
    label: 'CURRENT',
    labelColor: 'var(--color-brass)',
  },
};

export default function AccountCard({ account, onTransfer, onStatusChange }) {
  const navigate = useNavigate();
  const { _id, accountType, currency = 'INR', status, balance = 0, createdAt } = account;

  const [showFullId, setShowFullId] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const accent = ACCOUNT_ACCENTS[accountType] ?? ACCOUNT_ACCENTS.SAVINGS;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  const created = createdAt
    ? new Date(createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const shortId = _id ? `···${_id.slice(-8).toUpperCase()}` : '—';

  const isFrozen = status === 'FROZEN';
  const isClosed = status === 'CLOSED';
  const isInactive = isFrozen || isClosed;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-col gap-5 p-6 border rounded-[var(--radius-lg)] overflow-hidden transition-all duration-200 group"
      style={{
        backgroundColor: 'var(--color-ink-soft)',
        borderColor: accent.borderColor,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent.hoverBorder)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = accent.borderColor)}
    >
      {/* Frozen / Closed overlay */}
      {isInactive && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)]"
          style={{ backgroundColor: 'rgba(11,14,19,0.72)', backdropFilter: 'blur(2px)' }}
          aria-label={`Account is ${status}`}
        >
          {isFrozen ? (
            <Snowflake size={28} style={{ color: '#60a5fa' }} />
          ) : (
            <Lock size={24} style={{ color: 'var(--color-slate)' }} />
          )}
          <span
            className="font-mono text-xs font-semibold tracking-widest uppercase"
            style={{ color: isFrozen ? '#93c5fd' : 'var(--color-slate)' }}
          >
            {status}
          </span>
        </div>
      )}

      {/* Accent strip at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accent.labelColor, opacity: 0.7 }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: accent.labelColor }}
          >
            {accountType}
          </span>
          <span
            className="font-mono text-2xl font-medium"
            style={{ color: 'var(--color-paper)' }}
          >
            {symbol}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-slate)' }}>
            Available balance
          </span>
        </div>
        <Badge status={status} />
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} aria-hidden="true" />

      {/* Details */}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="eyebrow mb-1">Account ID</dt>
          <dd className="font-mono flex items-center gap-1.5" style={{ color: 'var(--color-paper)' }}>
            <span className="select-all truncate" title={_id}>{showFullId ? _id : shortId}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowFullId(!showFullId); }}
              className="text-[var(--color-slate)] hover:text-[var(--color-paper)] p-0.5 rounded transition-colors cursor-pointer shrink-0"
              title={showFullId ? "Hide ID" : "Show ID"}
              aria-label={showFullId ? "Hide ID" : "Show ID"}
            >
              {showFullId ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
            <button
              onClick={handleCopy}
              className="text-[var(--color-slate)] hover:text-[var(--color-paper)] p-0.5 rounded transition-colors cursor-pointer shrink-0"
              title="Copy ID"
              aria-label="Copy ID"
            >
              {copied ? <Check size={11} style={{ color: '#4ade80' }} /> : <Copy size={11} />}
            </button>
          </dd>
        </div>
        <div>
          <dt className="eyebrow mb-1">Opened</dt>
          <dd className="font-mono" style={{ color: 'var(--color-paper)' }}>{created}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1">Currency</dt>
          <dd className="font-mono" style={{ color: 'var(--color-paper)' }}>{currency}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1">Type</dt>
          <dd className="font-mono" style={{ color: accent.labelColor }}>{accountType}</dd>
        </div>
      </dl>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => navigate(`/dashboard/account/${_id}`)}
          className="flex items-center gap-1.5 text-xs font-mono transition-colors duration-150 cursor-pointer"
          style={{ color: 'var(--color-slate)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-paper)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate)')}
          id={`view-txns-${_id}`}
        >
          Transactions <ArrowRight size={12} />
        </button>

        {status === 'ACTIVE' && onTransfer && (
          <>
            <span className="text-[var(--color-border)]">·</span>
            <button
              onClick={() => onTransfer(account)}
              className="text-xs font-mono transition-colors duration-150 cursor-pointer"
              style={{ color: 'var(--color-slate)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-brass)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate)')}
              id={`transfer-${_id}`}
            >
              Transfer
            </button>
          </>
        )}

        {status !== 'CLOSED' && onStatusChange && (
          <>
            <span style={{ color: 'var(--color-border)' }}>·</span>
            <button
              onClick={() => onStatusChange(account)}
              className="text-xs font-mono transition-colors duration-150 cursor-pointer"
              style={{ color: 'var(--color-slate)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isFrozen ? '#60a5fa' : 'var(--color-debit-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate)')}
              id={`status-${_id}`}
            >
              {isFrozen ? 'Unfreeze' : 'Freeze / Close'}
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
