import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileWarning } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useRaiseDispute } from '../../hooks/useTransactions';

export default function RaiseDisputeModal({ isOpen, onClose, transaction }) {
  const [reason, setReason] = useState('');
  const { mutate, isPending, isSuccess, isError, error, reset } = useRaiseDispute();

  const amount = transaction?.amount ?? 0;
  const txnId = transaction?._id ?? '';
  const shortId = txnId ? `···${txnId.slice(-8).toUpperCase()}` : '—';

  function handleClose() {
    reset();
    setReason('');
    onClose();
  }

  function handleSubmit() {
    mutate({ transactionId: txnId, reason });
  }

  const getError = () => error?.response?.data?.message ?? error?.message ?? 'Failed to raise dispute.';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Raise a Dispute">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: 'var(--color-brass)', backgroundColor: 'rgba(182,141,64,0.1)' }}
            >
              <FileWarning size={28} style={{ color: 'var(--color-brass)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-paper)' }}>Dispute Filed</p>
              <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--color-slate)' }}>
                Our team will review your dispute and respond within 2–3 business days.
              </p>
            </div>
            <Button size="sm" onClick={handleClose} className="mt-2">Close</Button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
            {/* Transaction info */}
            <div
              className="p-3 rounded-[var(--radius-md)] border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ink)' }}
            >
              <div className="flex justify-between text-xs font-mono">
                <span style={{ color: 'var(--color-slate)' }}>Transaction</span>
                <span style={{ color: 'var(--color-paper)' }}>{shortId}</span>
              </div>
              <div className="flex justify-between text-xs font-mono mt-1.5">
                <span style={{ color: 'var(--color-slate)' }}>Amount</span>
                <span style={{ color: 'var(--color-brass)' }}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Warning */}
            <div
              className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs"
              style={{ backgroundColor: 'rgba(182,141,64,0.07)', border: '1px solid rgba(182,141,64,0.2)', color: 'var(--color-slate-light)' }}
            >
              <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--color-brass)' }} />
              This transaction will be marked as disputed pending review. Provide as much detail as possible.
            </div>

            {/* Reason textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="eyebrow" style={{ color: 'var(--color-slate-light)' }}>Reason for Dispute</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the issue in detail... (min 10 characters)"
                rows={4}
                maxLength={1000}
                className="w-full bg-transparent border rounded-[var(--radius-sm)] px-4 py-3 text-sm font-[var(--font-body)] resize-none outline-none transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-paper)',
                  caretColor: 'var(--color-brass)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brass)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
              <span className="text-xs text-right" style={{ color: 'var(--color-slate)' }}>
                {reason.length}/1000
              </span>
            </div>

            {isError && (
              <div className="flex items-center gap-2 text-xs p-2.5 rounded-[var(--radius-sm)]"
                style={{ backgroundColor: 'rgba(155,59,59,0.12)', border: '1px solid rgba(155,59,59,0.3)', color: 'var(--color-debit-light)' }}>
                <AlertCircle size={13} className="shrink-0" /> {getError()}
              </div>
            )}

            <div className="flex gap-3 justify-between mt-1">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSubmit}
                loading={isPending}
                disabled={reason.trim().length < 10}
              >
                <FileWarning size={14} /> File Dispute
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
