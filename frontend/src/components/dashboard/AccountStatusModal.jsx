import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Snowflake, Lock, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useUpdateAccountStatus } from '../../hooks/useAccounts';

const STATUS_CONFIG = {
  FROZEN: {
    icon: Snowflake,
    iconColor: '#60a5fa',
    title: 'Freeze Account',
    description: "You won't be able to send or receive funds until this account is unfrozen. Your existing balance is preserved.",
    action: 'Freeze Account',
    confirmVariant: 'secondary',
  },
  ACTIVE: {
    icon: Snowflake,
    iconColor: '#4ade80',
    title: 'Unfreeze Account',
    description: 'Your account will be restored to active status. Transfers and deposits will be re-enabled.',
    action: 'Unfreeze Account',
    confirmVariant: 'primary',
  },
  CLOSED: {
    icon: Lock,
    iconColor: 'var(--color-debit-light)',
    title: 'Close Account',
    description: 'This action is permanent. Once closed, the account cannot be reopened. Ensure your balance is zero before closing.',
    action: 'Close Permanently',
    confirmVariant: 'danger',
  },
};

function getApiErrorMessage(error) {
  return error?.response?.data?.message ?? error?.message ?? 'Failed to update account status.';
}

/**
 * AccountStatusModal
 * Shows a contextual confirmation depending on the target status.
 *
 * @param {{ account, targetStatus, onClose }} props
 */
export default function AccountStatusModal({ isOpen, onClose, account, targetStatus }) {
  const { mutate, isPending, isError, error, reset, isSuccess } = useUpdateAccountStatus();

  const config = STATUS_CONFIG[targetStatus] ?? STATUS_CONFIG.FROZEN;
  const Icon = config.icon;

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    mutate(
      { id: account._id, status: targetStatus },
      { onSuccess: () => setTimeout(handleClose, 800) }
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={config.title}>
      <div className="flex flex-col gap-5">
        {/* Icon + description */}
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-ink)', border: '1px solid var(--color-border)' }}
          >
            <Icon size={18} style={{ color: config.iconColor }} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-body)' }}>
              {account?.accountType} Account ···{account?._id?.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-slate-light)' }}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Balance warning for CLOSE */}
        {targetStatus === 'CLOSED' && account?.balance > 0 && (
          <div
            className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs"
            style={{
              backgroundColor: 'rgba(155,59,59,0.12)',
              border: '1px solid rgba(155,59,59,0.3)',
              color: 'var(--color-debit-light)',
            }}
            role="alert"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              Your account has a balance of{' '}
              <strong>₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>.
              You must withdraw or transfer all funds before closing.
            </span>
          </div>
        )}

        {/* Success feedback */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs p-2"
              style={{ color: '#4ade80' }}
            >
              ✓ Status updated successfully
            </motion.div>
          )}
        </AnimatePresence>

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
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={config.confirmVariant}
            size="sm"
            loading={isPending}
            disabled={isPending || (targetStatus === 'CLOSED' && account?.balance > 0)}
            onClick={handleConfirm}
            id={`confirm-status-${targetStatus?.toLowerCase()}`}
          >
            {config.action}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
