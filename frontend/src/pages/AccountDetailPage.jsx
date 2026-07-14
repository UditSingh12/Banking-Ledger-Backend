import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import TransactionHistory from '../components/dashboard/TransactionHistory';
import AccountStatusModal from '../components/dashboard/AccountStatusModal';
import TransferFlow from '../components/dashboard/TransferFlow';
import Button from '../components/ui/Button';

export default function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useAccounts();

  const [statusModal, setStatusModal] = useState({ open: false, targetStatus: null });
  const [transferOpen, setTransferOpen] = useState(false);
  const [showFullId, setShowFullId] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!account) return;
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const account = accounts.find((a) => a._id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-ink)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-brass)' }} />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-ink)' }}>
        <p className="text-sm" style={{ color: 'var(--color-slate)' }}>Account not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Back to Dashboard</Button>
      </div>
    );
  }

  const isFrozen = account.status === 'FROZEN';
  const targetStatus = isFrozen ? 'ACTIVE' : 'FROZEN';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 h-16 border-b"
        style={{ backgroundColor: 'rgba(11,14,19,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-mono transition-colors cursor-pointer"
          style={{ color: 'var(--color-slate)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-paper)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate)')}
        >
          <ChevronLeft size={16} /> Dashboard
        </button>

        <div className="flex items-center gap-3">
          {account.status === 'ACTIVE' && (
            <Button size="sm" onClick={() => setTransferOpen(true)} id="transfer-from-detail-btn">
              Transfer
            </Button>
          )}
          {account.status !== 'CLOSED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusModal({ open: true, targetStatus })}
              id="toggle-status-btn"
            >
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </Button>
          )}
        </div>
      </header>

      {/* Account summary */}
      <div
        className="border-b px-6 md:px-12 py-8"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-1">
          <p
            className="font-mono text-xs font-semibold tracking-widest uppercase"
            style={{ color: account.accountType === 'SAVINGS' ? '#4ade80' : 'var(--color-brass)' }}
          >
            {account.accountType}
          </p>
          <p className="font-mono text-3xl font-medium" style={{ color: 'var(--color-paper)' }}>
            ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[var(--color-slate)]">
            <span className="select-all">ID: {showFullId ? account._id : `···${account._id.slice(-12).toUpperCase()}`}</span>
            <button
              onClick={() => setShowFullId(!showFullId)}
              className="hover:text-[var(--color-paper)] p-0.5 rounded transition-colors cursor-pointer"
              title={showFullId ? "Hide ID" : "Show ID"}
              aria-label={showFullId ? "Hide ID" : "Show ID"}
            >
              {showFullId ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
            <button
              onClick={handleCopy}
              className="hover:text-[var(--color-paper)] p-0.5 rounded transition-colors cursor-pointer"
              title="Copy ID"
              aria-label="Copy ID"
            >
              {copied ? <Check size={11} style={{ color: '#4ade80' }} /> : <Copy size={11} />}
            </button>
            <span className="text-[var(--color-border)]">·</span>
            <span className="uppercase tracking-wider font-semibold">{account.status}</span>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <main className="flex-1 px-6 md:px-12 py-10 max-w-5xl mx-auto w-full">
        <TransactionHistory accountId={id} currency={account.currency} />
      </main>

      {/* Modals */}
      <AccountStatusModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, targetStatus: null })}
        account={account}
        targetStatus={statusModal.targetStatus}
      />
      <TransferFlow
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        fromAccount={account}
        allAccounts={accounts}
      />
    </div>
  );
}
