import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createAccountSchema } from '../../lib/schemas';
import { useCreateAccount } from '../../hooks/useAccounts';

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar',    symbol: '$' },
  { code: 'EUR', label: 'Euro',         symbol: '€' },
  { code: 'GBP', label: 'British Pound',symbol: '£' },
];

function getApiErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.message ??
    'Could not create account. Please try again.'
  );
}

export default function CreateAccountModal({ isOpen, onClose, onCreated }) {
  const [selected, setSelected] = useState(null);
  const { mutate, isPending, isError, isSuccess, error, reset } = useCreateAccount();

  const {
    handleSubmit,
    setValue,
    formState: { errors },
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(createAccountSchema),
  });

  function handleClose() {
    resetForm();
    reset();
    setSelected(null);
    onClose();
  }

  function handleSelect(code) {
    setSelected(code);
    setValue('currency', code, { shouldValidate: true });
  }

  function onSubmit(data) {
    // Generate idempotency key on every submit — prevents duplicate creation on retry
    const idempotencyKey = crypto.randomUUID();
    mutate(
      { currency: data.currency, idempotencyKey },
      {
        onSuccess: (account) => {
          onCreated?.(account);
          setTimeout(() => {
            handleClose();
          }, 1400);
        },
      }
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Open New Account">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <CheckCircle2 size={36} className="text-[#4ade80]" />
            <p className="text-sm text-[var(--color-paper)] font-[var(--font-body)]">
              Account opened successfully.
            </p>
            <p className="text-xs text-[var(--color-slate)]">
              Your new ledger account is now{' '}
              <span className="text-[#4ade80] font-mono">ACTIVE</span>.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {/* Currency selector */}
            <div className="flex flex-col gap-2">
              <p className="eyebrow text-[var(--color-slate-light)]">Select Currency</p>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCIES.map(({ code, label, symbol }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelect(code)}
                    className={[
                      'flex flex-col items-start gap-1 p-4 rounded-[var(--radius-md)] border',
                      'transition-colors duration-150 cursor-pointer text-left',
                      selected === code
                        ? 'border-[var(--color-brass)] bg-[rgba(182,141,64,0.08)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-slate)]',
                    ].join(' ')}
                    aria-pressed={selected === code}
                  >
                    <span className="font-mono text-lg text-[var(--color-brass)]">
                      {symbol}
                    </span>
                    <span className="font-mono text-xs text-[var(--color-paper)] font-medium">
                      {code}
                    </span>
                    <span className="text-xs text-[var(--color-slate)]">{label}</span>
                  </button>
                ))}
              </div>
              {errors.currency && (
                <p
                  role="alert"
                  className="text-xs text-[var(--color-debit-light)]"
                >
                  {errors.currency.message}
                </p>
              )}
            </div>

            {/* Idempotency note */}
            <p className="text-xs text-[var(--color-slate)] leading-relaxed">
              A unique idempotency key is generated on submit — safe to retry
              without creating duplicates.
            </p>

            {/* API error */}
            <AnimatePresence>
              {isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs text-[var(--color-debit-light)]"
                  style={{
                    backgroundColor: 'rgba(155,59,59,0.12)',
                    border: '1px solid rgba(155,59,59,0.3)',
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
                Open Account
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
