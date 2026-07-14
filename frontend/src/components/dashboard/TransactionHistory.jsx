import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { useTransactionHistory } from '../../hooks/useTransactions';
import ReversalModal from './ReversalModal';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

function formatAmount(amount, currency = 'INR') {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym}${(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TypeBadge({ type }) {
  const colors = {
    TRANSFER: 'var(--color-brass)',
    DEPOSIT: '#4ade80',
    WITHDRAWAL: 'var(--color-debit-light)',
    REVERSAL: '#60a5fa',
  };
  return (
    <span
      className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
      style={{
        color: colors[type] ?? 'var(--color-slate)',
        borderColor: `${colors[type]}40`,
        backgroundColor: `${colors[type]}10`,
      }}
    >
      {type}
    </span>
  );
}

function DirectionArrow({ isCredit }) {
  return isCredit ? (
    <ArrowDown size={13} className="shrink-0" style={{ color: '#4ade80' }} />
  ) : (
    <ArrowUp size={13} className="shrink-0" style={{ color: 'var(--color-debit-light)' }} />
  );
}

/**
 * TransactionHistory — filterable, paginated ledger table.
 *
 * @param {{ accountId, currency }} props
 */
export default function TransactionHistory({ accountId, currency = 'INR' }) {
  const [filters, setFilters] = useState({ page: 1, limit: 15 });
  const [showFilters, setShowFilters] = useState(false);
  const [reversalTxn, setReversalTxn] = useState(null);

  const { data, isLoading, isError } = useTransactionHistory(accountId, filters);

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  function isCredit(txn) {
    return txn.toAccount?._id === accountId || txn.toAccount === accountId;
  }

  // Build a map of linked reversals
  const linkedMap = {};
  transactions.forEach((txn) => {
    if (txn.reversalOf) linkedMap[txn.reversalOf] = txn._id;
    if (txn.reversedBy) linkedMap[txn._id] = txn.reversedBy;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow" style={{ color: 'var(--color-brass)' }}>Ledger History</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-slate)' }}>
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-[var(--radius-sm)] border transition-colors cursor-pointer"
          style={{
            color: showFilters ? 'var(--color-brass)' : 'var(--color-slate)',
            borderColor: showFilters ? 'rgba(182,141,64,0.4)' : 'var(--color-border)',
            backgroundColor: showFilters ? 'rgba(182,141,64,0.06)' : 'transparent',
          }}
        >
          <Filter size={12} />
          Filters
        </button>
      </div>

      {/* Filter bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-[var(--radius-md)] border"
            style={{ backgroundColor: 'rgba(22,27,36,0.8)', borderColor: 'var(--color-border)' }}
          >
            {/* Direction */}
            <div>
              <p className="eyebrow mb-1.5">Direction</p>
              <select
                value={filters.direction ?? ''}
                onChange={(e) => updateFilter('direction', e.target.value || undefined)}
                className="w-full px-2 py-1.5 text-xs font-mono rounded border bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-paper)' }}
              >
                <option value="">All</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </select>
            </div>
            {/* Type */}
            <div>
              <p className="eyebrow mb-1.5">Type</p>
              <select
                value={filters.type ?? ''}
                onChange={(e) => updateFilter('type', e.target.value || undefined)}
                className="w-full px-2 py-1.5 text-xs font-mono rounded border bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-paper)' }}
              >
                <option value="">All</option>
                <option value="TRANSFER">Transfer</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="REVERSAL">Reversal</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <p className="eyebrow mb-1.5">Status</p>
              <select
                value={filters.status ?? ''}
                onChange={(e) => updateFilter('status', e.target.value || undefined)}
                className="w-full px-2 py-1.5 text-xs font-mono rounded border bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-paper)' }}
              >
                <option value="">All</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>
            {/* Start Date */}
            <div>
              <p className="eyebrow mb-1.5">From Date</p>
              <input
                type="date"
                value={filters.startDate ?? ''}
                onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
                className="w-full px-2 py-1.5 text-xs font-mono rounded border bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-paper)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-12 rounded animate-pulse"
              style={{ backgroundColor: 'var(--color-ink-soft)' }}
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-slate)' }}>
          Failed to load transactions.
        </p>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--color-slate)' }}>No transactions found.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-slate)' }}>
            Transactions will appear here once you make transfers.
          </p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 rounded-t-[var(--radius-sm)]"
            style={{ backgroundColor: 'rgba(22,27,36,0.8)', borderBottom: '1px solid var(--color-border)' }}
          >
            {['Transaction', 'Type', 'Status', 'Amount'].map((h) => (
              <span key={h} className="eyebrow">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div
            className="border rounded-b-[var(--radius-md)] divide-y overflow-hidden"
            style={{ borderColor: 'var(--color-border)', divideColor: 'var(--color-border)' }}
          >
            {transactions.map((txn) => {
              const credit = isCredit(txn);
              const isLinked = !!linkedMap[txn._id];
              const isReversal = txn.type === 'REVERSAL';
              const canReverse = txn.status === 'COMPLETED' && !txn.reversedBy && txn.type !== 'REVERSAL';

              return (
                <motion.div
                  key={txn._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={[
                    'grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 items-center text-xs transition-colors',
                    isLinked ? 'border-l-2' : '',
                  ].join(' ')}
                  style={{
                    backgroundColor: isReversal ? 'rgba(96,165,250,0.04)' : 'transparent',
                    borderLeftColor: isLinked ? '#60a5fa' : 'transparent',
                  }}
                >
                  {/* Transaction info */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <DirectionArrow isCredit={credit} />
                      <span className="font-mono truncate" style={{ color: 'var(--color-paper)' }}>
                        ···{txn._id.slice(-8).toUpperCase()}
                      </span>
                      {isLinked && (
                        <span className="flex items-center gap-0.5 font-mono text-[10px]" style={{ color: '#60a5fa' }}>
                          <RotateCcw size={9} />
                          linked
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--color-slate)' }}>
                      {formatDate(txn.createdAt)}
                    </span>
                    {txn.note && (
                      <span className="text-[11px] italic truncate" style={{ color: 'var(--color-slate)' }}>
                        {txn.note}
                      </span>
                    )}
                    {/* Reversal action */}
                    {canReverse && (
                      <button
                        onClick={() => setReversalTxn(txn)}
                        className="text-[11px] font-mono mt-0.5 self-start transition-colors cursor-pointer"
                        style={{ color: 'var(--color-slate)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#60a5fa')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate)')}
                      >
                        ↩ Reverse
                      </button>
                    )}
                  </div>

                  {/* Type */}
                  <TypeBadge type={txn.type} />

                  {/* Status */}
                  <span
                    className="font-mono text-[11px]"
                    style={{
                      color:
                        txn.status === 'COMPLETED' ? '#4ade80'
                          : txn.status === 'FAILED' ? 'var(--color-debit-light)'
                          : txn.status === 'REVERSED' ? '#60a5fa'
                          : 'var(--color-slate)',
                    }}
                  >
                    {txn.status}
                  </span>

                  {/* Amount */}
                  <span
                    className="font-mono font-medium text-right tabular-nums"
                    style={{
                      color: credit ? '#4ade80' : 'var(--color-debit-light)',
                    }}
                  >
                    {credit ? '+' : '−'}{formatAmount(txn.amount, currency)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs mt-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 font-mono px-3 py-1.5 rounded border transition-colors disabled:opacity-30 cursor-pointer"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-slate)' }}
              >
                <ChevronLeft size={13} /> Previous
              </button>
              <span className="font-mono" style={{ color: 'var(--color-slate)' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 font-mono px-3 py-1.5 rounded border transition-colors disabled:opacity-30 cursor-pointer"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-slate)' }}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Reversal modal */}
      <ReversalModal
        isOpen={!!reversalTxn}
        onClose={() => setReversalTxn(null)}
        transaction={reversalTxn}
      />
    </div>
  );
}
