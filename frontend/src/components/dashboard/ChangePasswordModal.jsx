import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { changePasswordSchema } from '../../lib/schemas';
import { useChangePassword } from '../../hooks/useAuth';

function getApiError(error) {
  return (
    error?.response?.data?.message ??
    error?.message ??
    'Something went wrong. Please try again.'
  );
}

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { mutate, isPending, isError, isSuccess, error, reset } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  });

  function handleClose() {
    resetForm();
    reset();
    onClose();
  }

  function onSubmit({ currentPassword, newPassword }) {
    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setTimeout(() => handleClose(), 1600);
        },
      }
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <CheckCircle2 size={36} className="text-[#4ade80]" />
            <p className="text-sm text-[var(--color-paper)]">Password changed successfully.</p>
            <p className="text-xs text-[var(--color-slate)]">
              Use your new password on your next login.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <Input
              label="Current Password"
              id="currentPassword"
              type="password"
              placeholder="Your current password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="New Password"
              id="newPassword"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              id="confirmPassword"
              type="password"
              placeholder="Repeat new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

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
                  {getApiError(error)}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 justify-end pt-1">
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
                Update Password
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
