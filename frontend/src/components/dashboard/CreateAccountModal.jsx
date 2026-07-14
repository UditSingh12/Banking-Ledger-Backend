import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LedgerStamp from '../ui/LedgerStamp';
import { useCreateAccount } from '../../hooks/useAccounts';

const ACCOUNT_TYPES = [
  {
    type: 'SAVINGS',
    accentColor: 'var(--color-ledger)',
    accentLight: 'rgba(23,57,46,0.25)',
    accentBorder: 'rgba(31,77,61,0.7)',
    label: 'Savings Account',
    description: 'For building your reserves. Ideal for long-term deposits and personal funds.',
    rulingColor: 'rgba(31,77,61,0.15)',
  },
  {
    type: 'CURRENT',
    accentColor: 'var(--color-brass)',
    accentLight: 'rgba(182,141,64,0.12)',
    accentBorder: 'rgba(182,141,64,0.55)',
    label: 'Current Account',
    description: 'For active use. Designed for frequent transactions and day-to-day operations.',
    rulingColor: 'rgba(182,141,64,0.10)',
  },
];

function getApiErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.message ??
    'Could not create account. Please try again.'
  );
}

export default function CreateAccountModal({ isOpen, onClose, onCreated, existingTypes = [] }) {
  const [selected, setSelected] = useState(null);
  const { mutate, isPending, isError, isSuccess, error, reset } = useCreateAccount();

  function handleClose() {
    reset();
    setSelected(null);
    onClose();
  }

  function onSubmit() {
    if (!selected) return;
    mutate(
      { accountType: selected },
      {
        onSuccess: (account) => {
          onCreated?.(account);
        },
      }
    );
  }

  const alreadyOwned = (type) => existingTypes.includes(type);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Open New Account">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <LedgerStamp
            key="stamp"
            show
            label="OPENED"
            subLabel={`Your ${selected} account is now ACTIVE and ready for transactions.`}
          />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            {/* Ledger-book type selector */}
            <div className="flex flex-col gap-3">
              <p className="eyebrow" style={{ color: 'var(--color-slate-light)' }}>
                Select Account Type
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map(({ type, label, description, accentLight, accentBorder, rulingColor }) => {
                  const owned = alreadyOwned(type);
                  const isSelected = selected === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={owned}
                      onClick={() => !owned && setSelected(type)}
                      className={[
                        'relative flex flex-col items-start gap-2 p-4 rounded-[var(--radius-md)] border text-left overflow-hidden',
                        'transition-all duration-200',
                        owned
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer',
                      ].join(' ')}
                      style={{
                        backgroundColor: isSelected ? accentLight : 'var(--color-ink)',
                        borderColor: isSelected ? accentBorder : 'var(--color-border)',
                        // Ruled ledger lines in the card background
                        backgroundImage: isSelected
                          ? `repeating-linear-gradient(to bottom, transparent, transparent 15px, ${rulingColor} 15px, ${rulingColor} 16px)`
                          : 'none',
                      }}
                      aria-pressed={isSelected}
                      aria-disabled={owned}
                    >
                      {/* Account type badge */}
                      <span
                        className="font-mono text-xs font-semibold tracking-widest uppercase"
                        style={{ color: isSelected ? accentBorder : 'var(--color-slate)' }}
                      >
                        {type}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: isSelected ? 'var(--color-paper)' : 'var(--color-slate-light)', fontFamily: 'var(--font-body)' }}
                      >
                        {label}
                      </span>
                      <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-slate)' }}>
                        {description}
                      </span>

                      {/* "Already held" inline reason */}
                      {owned && (
                        <span
                          className="font-mono text-[10px] mt-1"
                          style={{ color: 'var(--color-debit-light)' }}
                        >
                          Already held
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
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
                  {getApiErrorMessage(error)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                loading={isPending}
                disabled={isPending || !selected}
                onClick={onSubmit}
              >
                Open Account
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
