import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Receipt, AlertTriangle, Unlock,
  Flag, FlagOff, CheckCircle, XCircle, RefreshCw, ChevronRight, ChevronLeft as ChevLeft,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminUsers, useAdminUnlockUser, useAdminTransactions, useAdminDisputes, useAdminResolveDispute, useAdminFlagAccount } from '../hooks/useAdmin';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

// ── Helper to format INR amounts ───────────────────────────────────────────
const fmt = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Shared Pagination component ────────────────────────────────────────────
function Pagination({ pagination, page, setPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-6 text-xs font-mono" style={{ color: 'var(--color-slate)' }}>
      <span>{pagination.total} total</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="p-1 rounded disabled:opacity-30 hover:text-[var(--color-paper)] transition-colors cursor-pointer"
        ><ChevLeft size={14} /></button>
        <span style={{ color: 'var(--color-paper)' }}>{page} / {pagination.totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
          disabled={page >= pagination.totalPages}
          className="p-1 rounded disabled:opacity-30 hover:text-[var(--color-paper)] transition-colors cursor-pointer"
        ><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function Skeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-[var(--radius-md)] animate-pulse" style={{ backgroundColor: 'var(--color-ink-soft)' }} />
      ))}
    </div>
  );
}

// ── Table wrapper ──────────────────────────────────────────────────────────
function LedgerTable({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr style={{ backgroundColor: 'rgba(182,141,64,0.06)', borderBottom: '1px solid var(--color-border)' }}>
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left eyebrow" style={{ color: 'var(--color-brass)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function TR({ children, striped }) {
  return (
    <tr
      style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: striped ? 'rgba(182,141,64,0.02)' : 'transparent' }}
    >
      {children}
    </tr>
  );
}

function TD({ children, accent }) {
  return (
    <td className="px-4 py-3" style={{ color: accent || 'var(--color-paper)' }}>{children}</td>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminUsers({ page, limit: 20 });
  const { mutate: unlockUser, isPending: unlocking } = useAdminUnlockUser();

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow" style={{ color: 'var(--color-brass)' }}>All Users — {pagination?.total ?? '…'}</p>
        <button onClick={() => refetch()} className="text-[var(--color-slate)] hover:text-[var(--color-paper)] transition-colors cursor-pointer">
          <RefreshCw size={13} />
        </button>
      </div>

      {isLoading ? <Skeleton /> : (
        <LedgerTable headers={['Name', 'Email', 'Role', 'Verified', 'Joined', 'Actions']}>
          {users.map((u, i) => (
            <TR key={u._id} striped={i % 2 === 1}>
              <TD>{u.name}</TD>
              <TD accent="var(--color-slate-light)">{u.email}</TD>
              <TD accent={u.role === 'ADMIN' ? 'var(--color-brass)' : 'var(--color-slate)'}>{u.role}</TD>
              <TD accent={u.isVerified ? '#4ade80' : 'var(--color-debit-light)'}>{u.isVerified ? 'Yes' : 'No'}</TD>
              <TD accent="var(--color-slate)">{fmtDate(u.createdAt).split(',')[0]}</TD>
              <TD>
                {(u.failedLoginAttempts > 0 || u.lockUntil) && (
                  <button
                    onClick={() => unlockUser(u._id)}
                    disabled={unlocking}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                    style={{
                      border: '1px solid rgba(212,168,83,0.4)',
                      color: 'var(--color-brass)',
                      backgroundColor: 'rgba(182,141,64,0.07)',
                    }}
                  >
                    <Unlock size={10} /> Unlock
                  </button>
                )}
              </TD>
            </TR>
          ))}
        </LedgerTable>
      )}
      <Pagination pagination={pagination} page={page} setPage={setPage} />
    </div>
  );
}

// ── Transactions Tab ───────────────────────────────────────────────────────
function TransactionsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading, refetch } = useAdminTransactions({ page, limit: 20, status: statusFilter || undefined });

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;

  const STATUS_COLORS = {
    COMPLETED: '#4ade80',
    PENDING: 'var(--color-brass)',
    FAILED: 'var(--color-debit-light)',
    REVERSED: '#93c5fd',
    DISPUTED: '#f97316',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="eyebrow" style={{ color: 'var(--color-brass)' }}>All Transactions — {pagination?.total ?? '…'}</p>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs font-mono px-3 py-1.5 rounded-[var(--radius-sm)] border outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--color-ink-soft)', borderColor: 'var(--color-border)', color: 'var(--color-slate-light)' }}
          >
            <option value="">All statuses</option>
            {['COMPLETED', 'PENDING', 'FAILED', 'REVERSED', 'DISPUTED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => refetch()} className="text-[var(--color-slate)] hover:text-[var(--color-paper)] transition-colors cursor-pointer">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {isLoading ? <Skeleton /> : (
        <LedgerTable headers={['ID', 'Type', 'Status', 'Amount', 'Date']}>
          {transactions.map((t, i) => (
            <TR key={t._id} striped={i % 2 === 1}>
              <TD accent="var(--color-slate)">···{t._id.slice(-8).toUpperCase()}</TD>
              <TD accent="var(--color-slate-light)">{t.type}</TD>
              <TD accent={STATUS_COLORS[t.status] ?? 'var(--color-slate)'}>{t.status}</TD>
              <TD accent="var(--color-paper)">{fmt(t.amount)}</TD>
              <TD accent="var(--color-slate)">{fmtDate(t.createdAt)}</TD>
            </TR>
          ))}
        </LedgerTable>
      )}
      <Pagination pagination={pagination} page={page} setPage={setPage} />
    </div>
  );
}

// ── Disputes Tab ───────────────────────────────────────────────────────────
function DisputesTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [resolveModal, setResolveModal] = useState(null); // { dispute, action }
  const [resolution, setResolution] = useState('');

  const { data, isLoading, refetch } = useAdminDisputes({ page, limit: 20, status: statusFilter || undefined });
  const { mutate: resolve, isPending: resolving } = useAdminResolveDispute();

  const disputes = data?.disputes ?? [];
  const pagination = data?.pagination;

  const STATUS_COLORS = {
    OPEN: '#f97316',
    UNDER_REVIEW: 'var(--color-brass)',
    RESOLVED: '#4ade80',
    REJECTED: 'var(--color-debit-light)',
  };

  function handleResolve(action) {
    resolve(
      { disputeId: resolveModal.dispute._id, data: { status: action, resolution } },
      {
        onSuccess: () => {
          setResolveModal(null);
          setResolution('');
          refetch();
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="eyebrow" style={{ color: 'var(--color-brass)' }}>Disputes — {pagination?.total ?? '…'}</p>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs font-mono px-3 py-1.5 rounded-[var(--radius-sm)] border outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--color-ink-soft)', borderColor: 'var(--color-border)', color: 'var(--color-slate-light)' }}
          >
            <option value="">All</option>
            {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => refetch()} className="text-[var(--color-slate)] hover:text-[var(--color-paper)] transition-colors cursor-pointer">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {isLoading ? <Skeleton /> : disputes.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--color-slate)' }}>No disputes found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((d) => (
            <motion.div
              key={d._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-[var(--radius-md)] border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ink-soft)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs" style={{ color: 'var(--color-slate)' }}>
                      ···{d._id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
                      style={{ color: STATUS_COLORS[d.status], backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${STATUS_COLORS[d.status]}30` }}
                    >
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-slate-light)' }}>
                    Raised by <span style={{ color: 'var(--color-paper)' }}>{d.raisedBy?.name}</span>
                    {' — '}
                    <span style={{ color: 'var(--color-brass)' }}>{fmt(d.transaction?.amount)}</span>
                    {' on '}{fmtDate(d.createdAt)}
                  </p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-slate)' }}>{d.reason}</p>
                </div>

                {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setResolveModal({ dispute: d, action: 'RESOLVED' }); setResolution(''); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-mono transition-colors cursor-pointer"
                      style={{ border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', backgroundColor: 'rgba(23,57,46,0.3)' }}
                    >
                      <CheckCircle size={11} /> Resolve
                    </button>
                    <button
                      onClick={() => { setResolveModal({ dispute: d, action: 'REJECTED' }); setResolution(''); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-mono transition-colors cursor-pointer"
                      style={{ border: '1px solid rgba(155,59,59,0.3)', color: 'var(--color-debit-light)', backgroundColor: 'rgba(155,59,59,0.1)' }}
                    >
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                )}
              </div>
              {d.resolution && (
                <p className="text-[11px] mt-2 pt-2 border-t italic" style={{ borderColor: 'var(--color-border)', color: 'var(--color-slate)' }}>
                  Resolution: {d.resolution}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} page={page} setPage={setPage} />

      {/* Resolve / Reject confirmation modal */}
      <Modal
        isOpen={!!resolveModal}
        onClose={() => setResolveModal(null)}
        title={resolveModal?.action === 'RESOLVED' ? 'Resolve Dispute' : 'Reject Dispute'}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--color-slate)' }}>
            Provide a resolution note for the disputing user.
          </p>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Explain your decision..."
            rows={4}
            className="w-full bg-transparent border rounded-[var(--radius-sm)] px-4 py-3 text-sm resize-none outline-none transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-paper)', caretColor: 'var(--color-brass)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-brass)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setResolveModal(null)} disabled={resolving}>Cancel</Button>
            <Button
              variant={resolveModal?.action === 'RESOLVED' ? 'primary' : 'danger'}
              size="sm"
              loading={resolving}
              disabled={resolution.trim().length < 5}
              onClick={() => handleResolve(resolveModal.action)}
            >
              {resolveModal?.action === 'RESOLVED' ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {resolveModal?.action === 'RESOLVED' ? 'Confirm Resolve' : 'Confirm Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────
const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('disputes');

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-ink)' }}>
        <p className="text-sm" style={{ color: 'var(--color-debit-light)' }}>Access denied — Admin only.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 h-16 border-b"
        style={{ backgroundColor: 'rgba(11,14,19,0.96)', backdropFilter: 'blur(12px)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-mono transition-colors cursor-pointer"
            style={{ color: 'var(--color-slate)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-paper)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate)')}
          >
            <ChevronLeft size={16} /> Dashboard
          </button>
          <div className="w-px h-4" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ backgroundColor: 'rgba(182,141,64,0.15)', border: '1px solid rgba(182,141,64,0.3)' }}
            >
              <span className="font-mono text-[9px] font-bold" style={{ color: 'var(--color-brass)' }}>A</span>
            </div>
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--color-brass)' }}>
              Admin Console
            </span>
          </div>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--color-slate)' }}>{user?.email}</span>
      </header>

      {/* Tab Navigation */}
      <div className="border-b px-6 md:px-12" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-5 py-4 text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer relative"
              style={{ color: activeTab === id ? 'var(--color-paper)' : 'var(--color-slate)' }}
            >
              <Icon size={13} />
              {label}
              {activeTab === id && (
                <motion.div
                  layoutId="admin-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: 'var(--color-brass)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 md:px-12 py-10 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'users'        && <UsersTab />}
            {activeTab === 'transactions' && <TransactionsTab />}
            {activeTab === 'disputes'     && <DisputesTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
