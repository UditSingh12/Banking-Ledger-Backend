import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut, KeyRound, ShieldCheck, ShieldOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAccounts } from '../hooks/useAccounts';
import { useLogout } from '../hooks/useAuth';
import AccountCard from '../components/dashboard/AccountCard';
import CreateAccountModal from '../components/dashboard/CreateAccountModal';
import ChangePasswordModal from '../components/dashboard/ChangePasswordModal';
import AccountStatusModal from '../components/dashboard/AccountStatusModal';
import TransferFlow from '../components/dashboard/TransferFlow';
import Button from '../components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: accounts = [], isLoading: accountsLoading, isError: accountsError } = useAccounts();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  // Account status modal
  const [statusModal, setStatusModal] = useState({ open: false, account: null, targetStatus: null });

  // Transfer flow
  const [transferModal, setTransferModal] = useState({ open: false, fromAccount: null });

  const existingTypes = accounts.map((a) => a.accountType);

  function openStatusModal(account) {
    // If currently ACTIVE: show FROZEN/CLOSED selector
    // If currently FROZEN: go straight to ACTIVE (unfreeze)
    const targetStatus = account.status === 'FROZEN' ? 'ACTIVE' : account.status === 'ACTIVE' ? 'FROZEN' : null;
    if (!targetStatus) return;
    setStatusModal({ open: true, account, targetStatus });
  }

  function openTransfer(account) {
    setTransferModal({ open: true, fromAccount: account });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-ink)' }}>
      {/* Dashboard nav */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 h-16 border-b border-[var(--color-border)]"
        style={{ backgroundColor: 'rgba(11,14,19,0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block w-5 h-[1.5px] bg-[var(--color-brass)]" />
            <span className="block w-3 h-[1.5px] bg-[var(--color-brass)] opacity-60" />
            <span className="block w-5 h-[1.5px] bg-[var(--color-brass)]" />
          </span>
          <span className="font-mono text-sm tracking-widest uppercase text-[var(--color-paper)]">
            Ledger
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user?.name && (
            <span className="hidden sm:block text-xs text-[var(--color-slate)] font-mono">
              {user.name}
            </span>
          )}

          <button
            onClick={() => setChangePasswordOpen(true)}
            title="Change password"
            aria-label="Change password"
            id="change-password-btn"
            className="flex items-center gap-1.5 text-xs text-[var(--color-slate)] hover:text-[var(--color-paper)] transition-colors duration-150 cursor-pointer"
          >
            <KeyRound size={14} />
            <span className="hidden sm:inline">Password</span>
          </button>

          <div className="w-px h-4 bg-[var(--color-border)]" aria-hidden="true" />

          {/* Admin Console link — only visible to ADMIN users */}
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 text-xs transition-colors duration-150 cursor-pointer"
                style={{ color: 'var(--color-brass)' }}
                title="Admin Console"
                id="admin-console-btn"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <div className="w-px h-4 bg-[var(--color-border)]" aria-hidden="true" />
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            loading={loggingOut}
            className="gap-1.5"
            id="logout-btn"
          >
            <LogOut size={13} />
            Log out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2">
            <p className="eyebrow text-[var(--color-brass)]">Overview</p>
            <h1
              className="text-3xl font-light text-[var(--color-paper)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your Accounts
            </h1>
            {user?.email && (
              <p className="text-xs text-[var(--color-slate)] font-mono">{user.email}</p>
            )}
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            id="create-account-btn"
            className="gap-2 self-start sm:self-auto"
            disabled={existingTypes.length >= 2}
            title={existingTypes.length >= 2 ? 'You already hold both account types' : undefined}
          >
            <Plus size={15} />
            New Account
          </Button>
        </div>

        {/* Loading skeleton */}
        {accountsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] animate-pulse"
                style={{ backgroundColor: 'var(--color-ink-soft)' }}
              />
            ))}
          </div>
        )}

        {/* Account grid */}
        {!accountsLoading && accounts.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            {accounts.map((account) => (
              <AccountCard
                key={account._id}
                account={account}
                onTransfer={openTransfer}
                onStatusChange={openStatusModal}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!accountsLoading && accounts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border border-[var(--color-border)]"
              style={{ backgroundColor: 'var(--color-ink-soft)' }}
              aria-hidden="true"
            >
              <span className="flex flex-col gap-[3px]">
                <span className="block w-6 h-[1.5px] bg-[var(--color-border)]" />
                <span className="block w-4 h-[1.5px] bg-[var(--color-border)]" />
                <span className="block w-6 h-[1.5px] bg-[var(--color-border)]" />
              </span>
            </div>
            <p className="text-sm text-[var(--color-slate)]">No accounts yet.</p>
            <p className="text-xs text-[var(--color-slate)] max-w-xs">
              Open your first ledger account to start tracking entries.
            </p>
            <Button onClick={() => setCreateModalOpen(true)} size="sm" className="mt-2">
              <Plus size={14} /> Open First Account
            </Button>
          </motion.div>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        existingTypes={existingTypes}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <AccountStatusModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, account: null, targetStatus: null })}
        account={statusModal.account}
        targetStatus={statusModal.targetStatus}
      />

      <TransferFlow
        isOpen={transferModal.open}
        onClose={() => setTransferModal({ open: false, fromAccount: null })}
        fromAccount={transferModal.fromAccount}
        allAccounts={accounts}
      />
    </div>
  );
}
