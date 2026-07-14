import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronRight, ArrowLeftRight } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LedgerStamp from '../ui/LedgerStamp';
import { useTransfer } from '../../hooks/useTransactions';

const STEPS = ['Source', 'Recipient', 'Amount', 'Review', 'Confirm'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < current
                ? 'var(--color-brass)'
                : i === current
                  ? 'var(--color-paper)'
                  : 'var(--color-border)',
            }}
          />
          {i < STEPS.length - 1 && (
            <div
              className="w-4 h-px transition-colors duration-300"
              style={{ backgroundColor: i < current ? 'var(--color-brass)' : 'var(--color-border)' }}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-[11px] font-mono" style={{ color: 'var(--color-slate)' }}>
        {STEPS[current]}
      </span>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p className="eyebrow mb-2" style={{ color: 'var(--color-slate-light)' }}>{children}</p>;
}

function LedgerRow({ label, value, accent }) {
  return (
    <div
      className="flex justify-between items-center py-2.5 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span className="text-xs font-mono" style={{ color: 'var(--color-slate)' }}>{label}</span>
      <span className="text-xs font-mono font-medium" style={{ color: accent || 'var(--color-paper)' }}>{value}</span>
    </div>
  );
}

export default function TransferFlow({ isOpen, onClose, fromAccount, allAccounts = [] }) {
  const [step, setStep] = useState(0);
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID()); // generated once, reused on retry
  const { mutate, isPending, isSuccess, isError, error, reset } = useTransfer();

  const amountNum = parseFloat(amount) || 0;
  const balanceAfter = fromAccount ? fromAccount.balance - amountNum : 0;
  const toAccount = allAccounts.find((a) => a._id === toAccountId);

  function handleClose() {
    setStep(0);
    setToAccountId('');
    setAmount('');
    reset();
    onClose();
  }

  function handleConfirm() {
    mutate({
      fromAccount: fromAccount._id,
      toAccount: toAccountId,
      amount: amountNum,
      idempotencyKey,
    });
  }

  function getApiError() {
    return error?.response?.data?.message ?? error?.message ?? 'Transfer failed. Please try again.';
  }

  const canGoNext = () => {
    if (step === 0) return !!fromAccount;
    if (step === 1) return toAccountId.length === 24 && toAccountId !== fromAccount?._id;
    if (step === 2) return amountNum > 0 && amountNum <= (fromAccount?.balance ?? 0);
    if (step === 3) return true;
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Fund Transfer">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <LedgerStamp
            key="stamp"
            show
            label="CLEARED"
            subLabel={`₹${amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })} successfully transferred.`}
          />
        ) : (
          <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
            <StepIndicator current={step} />

            {/* Step 0: Source account (pre-selected, just confirm) */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <FieldLabel>Sending From</FieldLabel>
                {fromAccount ? (
                  <div
                    className="p-4 rounded-[var(--radius-md)] border"
                    style={{ backgroundColor: 'var(--color-ink)', borderColor: 'var(--color-brass)' }}
                  >
                    <p className="font-mono text-xs font-semibold" style={{ color: 'var(--color-brass)' }}>
                      {fromAccount.accountType}
                    </p>
                    <p className="font-mono text-lg mt-1" style={{ color: 'var(--color-paper)' }}>
                      ₹{fromAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-slate)' }}>
                      ···{fromAccount._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-slate)' }}>No source account selected.</p>
                )}
              </div>
            )}

            {/* Step 1: Recipient */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <FieldLabel>Recipient Account ID</FieldLabel>
                <input
                  type="text"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value.trim())}
                  placeholder="24-character account ID"
                  maxLength={24}
                  className="w-full px-4 py-3 rounded-[var(--radius-md)] border bg-transparent font-mono text-sm outline-none transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-paper)',
                    caretColor: 'var(--color-brass)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-brass)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
                {toAccountId && toAccountId === fromAccount?._id && (
                  <p className="text-xs" style={{ color: 'var(--color-debit-light)' }}>
                    Source and destination accounts must be different.
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Amount with live balance preview */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <FieldLabel>Transfer Amount (₹)</FieldLabel>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base"
                      style={{ color: 'var(--color-slate)' }}
                    >₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-[var(--radius-md)] border bg-transparent font-mono text-base outline-none transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-paper)',
                        caretColor: 'var(--color-brass)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--color-brass)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Real-time balance-after-transfer preview */}
                {amountNum > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-[var(--radius-sm)]"
                    style={{ backgroundColor: 'rgba(182,141,64,0.07)', border: '1px solid rgba(182,141,64,0.2)' }}
                  >
                    <div className="flex justify-between text-xs font-mono">
                      <span style={{ color: 'var(--color-slate)' }}>Current balance</span>
                      <span style={{ color: 'var(--color-paper)' }}>
                        ₹{fromAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono mt-1.5">
                      <span style={{ color: 'var(--color-slate)' }}>After transfer</span>
                      <span style={{ color: balanceAfter < 0 ? 'var(--color-debit-light)' : '#4ade80' }}>
                        ₹{Math.max(0, balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {balanceAfter < 0 && (
                      <p className="text-[11px] mt-2" style={{ color: 'var(--color-debit-light)' }}>
                        Insufficient balance for this transfer.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 3: Review — ledger entry preview */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <FieldLabel>Review Transfer</FieldLabel>
                <div
                  className="rounded-[var(--radius-md)] border overflow-hidden"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {/* Header */}
                  <div
                    className="px-4 py-2.5 flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(182,141,64,0.08)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className="eyebrow" style={{ color: 'var(--color-brass)' }}>Ledger Entry Preview</span>
                    <ArrowLeftRight size={13} style={{ color: 'var(--color-brass)' }} />
                  </div>
                  <div className="px-4">
                    <LedgerRow
                      label="DR — From"
                      value={`···${fromAccount._id.slice(-8).toUpperCase()} (${fromAccount.accountType})`}
                      accent="var(--color-debit-light)"
                    />
                    <LedgerRow
                      label="CR — To"
                      value={`···${toAccountId.slice(-8).toUpperCase()}${toAccount ? ` (${toAccount.accountType})` : ''}`}
                      accent="#4ade80"
                    />
                    <LedgerRow
                      label="Amount"
                      value={`₹${amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      accent="var(--color-paper)"
                    />
                    <LedgerRow
                      label="Balance after"
                      value={`₹${balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      accent={balanceAfter < 0 ? 'var(--color-debit-light)' : '#4ade80'}
                    />
                    <div className="py-2">
                      <LedgerRow
                        label="Idempotency Key"
                        value={`${idempotencyKey.slice(0, 8)}···`}
                        accent="var(--color-slate)"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-slate)' }}>
                  Please verify the details above before confirming. This action cannot be undone except via a reversal request.
                </p>
              </div>
            )}

            {/* API error */}
            <AnimatePresence>
              {isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs"
                  style={{
                    backgroundColor: 'rgba(155,59,59,0.12)',
                    border: '1px solid rgba(155,59,59,0.3)',
                    color: 'var(--color-debit-light)',
                  }}
                  role="alert"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  {getApiError()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 justify-between mt-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)}
                disabled={isPending}
              >
                {step === 0 ? 'Cancel' : '← Back'}
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!canGoNext()}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next <ChevronRight size={14} />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  loading={isPending}
                  disabled={isPending}
                  onClick={handleConfirm}
                >
                  Confirm Transfer
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
