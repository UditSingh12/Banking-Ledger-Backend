import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';

// ─── Double-Entry Ledger Strip Data ─────────────────────────────────────────
const ENTRIES = [
  { date: '12 Jul', account: 'Cash',           type: 'DR', amount: '₹50,000.00' },
  { date: '12 Jul', account: 'Capital Account', type: 'CR', amount: '₹50,000.00' },
  { date: '12 Jul', account: 'Inventory',       type: 'DR', amount: '₹12,300.00' },
  { date: '12 Jul', account: 'Cash',            type: 'CR', amount: '₹12,300.00' },
  { date: '12 Jul', account: 'Accounts Rec.',   type: 'DR', amount: '₹8,750.00'  },
  { date: '12 Jul', account: 'Revenue',         type: 'CR', amount: '₹8,750.00'  },
];

const BALANCES = [50000, 50000, 62300, 50000, 58750, 67500];

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function DoubleEntryStrip({ shouldAnimate }) {
  const [visible, setVisible] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!shouldAnimate) {
      setVisible(ENTRIES.length);
      return;
    }
    intervalRef.current = setInterval(() => {
      setVisible((v) => {
        if (v >= ENTRIES.length) {
          clearInterval(intervalRef.current);
          return v;
        }
        return v + 1;
      });
    }, 900);
    return () => clearInterval(intervalRef.current);
  }, [shouldAnimate]);

  return (
    <div
      className="w-full max-w-lg mx-auto border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden"
      style={{ backgroundColor: 'rgba(22,27,36,0.9)' }}
      aria-label="Double-entry ledger preview"
    >
      {/* Strip header */}
      <div className="grid grid-cols-[60px_1fr_48px_110px] gap-2 px-4 py-2.5 border-b border-[var(--color-border)]">
        {['Date', 'Account', 'Ref.', 'Amount'].map((h) => (
          <span key={h} className="eyebrow">{h}</span>
        ))}
      </div>

      {/* Entries */}
      <div className="divide-y divide-[var(--color-border)]">
        {ENTRIES.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={i < visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-[60px_1fr_48px_110px] gap-2 px-4 py-2.5 items-center"
          >
            <span className="font-mono text-xs text-[var(--color-slate)]">{entry.date}</span>
            <span className="text-xs text-[var(--color-paper)] font-[var(--font-body)] truncate">{entry.account}</span>
            <span
              className={[
                'font-mono text-xs font-medium tracking-wider',
                entry.type === 'DR'
                  ? 'text-[var(--color-debit-light)]'
                  : 'text-[#4ade80]',
              ].join(' ')}
            >
              {entry.type}
            </span>
            <span className="font-mono text-xs text-right text-[var(--color-paper)]">
              {entry.amount}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Running balance */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-brass)] border-opacity-30"
        style={{ borderTopColor: 'rgba(182,141,64,0.3)', backgroundColor: 'rgba(23, 57, 46, 0.15)' }}
      >
        <span className="eyebrow">Running Balance</span>
        <motion.span
          key={visible}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm font-medium text-[#4ade80]"
        >
          {formatINR(BALANCES[Math.max(0, visible - 1)] ?? 0)}
        </motion.span>
      </div>
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
export default function Hero() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 ledger-ruled overflow-hidden"
      aria-label="Hero"
    >
      {/* Subtle vertical brass accent line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(182,141,64,0.15), transparent)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center gap-10">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="eyebrow"
        >
          Double-Entry Banking Ledger
        </motion.p>

        {/* Display headline — Fraunces serif breaking across ruled lines */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55 }}
          className="text-5xl md:text-7xl font-light leading-tight text-[var(--color-paper)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Every entry{' '}
          <em
            className="not-italic"
            style={{ color: 'var(--color-brass)' }}
          >
            balanced.
          </em>
          <br />
          Every account{' '}
          <span className="text-[var(--color-slate-light)]">accounted for.</span>
        </motion.h1>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="max-w-xl text-base md:text-lg text-[var(--color-slate-light)] font-[var(--font-body)] leading-relaxed"
        >
          Backend Ledger is a precision banking platform built on double-entry
          principles — open multiple ledger accounts, move funds with idempotent
          transactions, and keep every debit paired with a credit.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex items-center gap-4 flex-wrap justify-center"
        >
          <Link to="/auth" tabIndex={-1}>
            <Button size="lg">Open an Account</Button>
          </Link>
          <Link to="/auth" tabIndex={-1}>
            <Button variant="ghost" size="lg">Sign in →</Button>
          </Link>
        </motion.div>

        {/* Animated Double-Entry Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.55 }}
          className="w-full mt-4"
        >
          <DoubleEntryStrip shouldAnimate={!prefersReduced} />
        </motion.div>
      </div>
    </section>
  );
}
