import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut, Info, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAccounts } from '../hooks/useAccounts';
import AccountCard from '../components/dashboard/AccountCard';
import CreateAccountModal from '../components/dashboard/CreateAccountModal';
import ChangePasswordModal from '../components/dashboard/ChangePasswordModal';
import Button from '../components/ui/Button';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [localAccounts, setLocalAccounts] = useState([]);

  const { data: fetchedAccounts, isLoading, isBackendPending } = useAccounts();

  // Merge fetched + locally-created accounts
  const accounts = [
    ...(Array.isArray(fetchedAccounts) ? fetchedAccounts : []),
    ...localAccounts,
  ];

  function handleLogout() {
    // NOTE: Call POST /api/auth/logout here once the endpoint exists on the backend.
    clearAuth();
    navigate('/', { replace: true });
  }

  function handleAccountCreated(newAccount) {
    setLocalAccounts((prev) => [newAccount, ...prev]);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-ink)' }}
    >
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

          {/* Change password */}
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
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
          >
            <Plus size={15} />
            New Account
          </Button>
        </div>

        {/* Backend-pending notice for GET /account */}
        <AnimatePresence>
          {isBackendPending && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 mb-8 p-3 rounded-[var(--radius-sm)] text-xs text-[var(--color-slate-light)]"
              style={{
                backgroundColor: 'rgba(107,114,128,0.1)',
                border: '1px solid var(--color-border)',
              }}
              role="status"
            >
              <Info size={14} className="shrink-0 mt-0.5 text-[var(--color-brass)]" />
              <span>
                Account listing is pending backend implementation{' '}
                <span className="font-mono">(GET /api/account)</span>. Accounts you
                create this session appear below.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-52 rounded-[var(--radius-lg)] border border-[var(--color-border)] animate-pulse"
                style={{ backgroundColor: 'var(--color-ink-soft)' }}
              />
            ))}
          </div>
        )}

        {/* Account grid */}
        {accounts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            {accounts.map((account) => (
              <AccountCard key={account._id} account={account} />
            ))}
          </motion.div>
        ) : (
          !isLoading && (
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
          )
        )}
      </main>

      {/* Modals */}
      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleAccountCreated}
      />
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}
