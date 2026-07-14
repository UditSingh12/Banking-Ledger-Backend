import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LedgerStamp from '../ui/LedgerStamp';
import { useReverseTransaction } from '../../hooks/useTransactions';

function getApiError(error) {
  return error?.response?.data?.message ?? error?.message ?? 'Reversal failed. Please try again.';
}

function formatAmount(amount) {
  return `₹${(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * ReversalModal — confirmation + reason step for reversing a transaction.
 *
 * @param {{ isOpen, onClose, transaction }} props
 */
export default function ReversalModal({ isOpen, onClose, transaction }) {
  const [reason, setReason] = useState('');
  const { mutate, isPending, isSuccess, isError, error, reset } = useReverseTransaction();

  function handleClose() {
    setReason('');
    reset();
    onClose();
  }

  function handleConfirm() {
    if (!reason.trim() || reason.trim().length < 3) return;
    mutate({ transactionId: transaction._id, reason });
  }

  const isValid = reason.trim().length >= 3;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Reversal">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <LedgerStamp
            key="stamp"
            show
            label="REVERSED"
            subLabel="The funds have been returned. This transaction is now marked as REVERSED."
          />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-5"
          >
            {/* Original transaction summary */}
            {transaction && (
              <div
                className="rounded-[var(--radius-md)] border overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(155,59,59,0.08)', borderBottom: '1px solid var(--color-border)' }}
                >
                  <RotateCcw size={13} style={{ color: 'var(--color-debit-light)' }} />
                  <span className="eyebrow" style={{ color: 'var(--color-debit-light)' }}>
                    Original Transaction
                  </span>
                </div>
                <div className="px-4 divide-y" style={{ divideColor: 'var(--color-border)' }}>
                  {[
                    { label: 'Amount', value: formatAmount(transaction.amount) },
                    { label: 'From', value: transaction.fromAccount ? `···${transaction.fromAccount._id?.slice(-8).toUpperCase() ?? ''}` : '—' },
                    { label: 'To', value: transaction.toAccount ? `···${transaction.toAccount._id?.slice(-8).toUpperCase() ?? ''}` : '—' },
                    { label: 'Status', value: transaction.status },
                    { label: 'ID', value: `···${transaction._id?.slice(-8).toUpperCase()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--color-slate)' }}>{label}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-paper)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reason input — required, consequential action */}
            <div>
              <label
                htmlFor="reversal-reason"
                className="eyebrow block mb-2"
                style={{ color: 'var(--color-slate-light)' }}
              >
                Reason for Reversal *
              </label>
              <textarea
                id="reversal-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Please provide a brief reason for this reversal..."
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border bg-transparent text-sm outline-none resize-none transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-paper)',
                  fontFamily: 'var(--font-body)',
                  caretColor: 'var(--color-debit)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-debit)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-slate)' }}>
                {reason.length}/500 characters
              </p>
            </div>

            {/* Warning */}
            <div
              className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs"
              style={{
                backgroundColor: 'rgba(155,59,59,0.07)',
                border: '1px solid rgba(155,59,59,0.2)',
                color: 'var(--color-slate-light)',
              }}
            >
              <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--color-debit-light)' }} />
              <span>
                Reversals move funds back from the recipient. If the recipient's account has insufficient balance, the reversal will fail.
              </span>
            </div>

            {/* API error */}
            <AnimatePresence>
              {isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs"
                  style={{
                    backgroundColor: 'rgba(155,59,59,0.12)',
                    border: '1px solid rgba(155,59,59,0.3)',
                    color: 'var(--color-debit-light)',
                  }}
                  role="alert"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  {getApiError(error)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isPending}
                disabled={isPending || !isValid}
                onClick={handleConfirm}
                id="confirm-reversal-btn"
              >
                Reverse Transfer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
