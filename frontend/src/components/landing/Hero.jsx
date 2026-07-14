import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

// ─── Random Ledger Entry Generator ──────────────────────────────────────────

const ACCOUNT_PAIRS = [
  { dr: 'Cash Account',       cr: 'Capital Account',    range: [20000, 100000] },
  { dr: 'Inventory',          cr: 'Cash Account',       range: [5000,  40000]  },
  { dr: 'Accounts Rec.',      cr: 'Revenue',            range: [3000,  25000]  },
  { dr: 'Office Supplies',    cr: 'Cash Account',       range: [800,   8000]   },
  { dr: 'Equipment',          cr: 'Bank Loan',          range: [15000, 80000]  },
  { dr: 'Salary Expense',     cr: 'Cash Account',       range: [12000, 60000]  },
  { dr: 'Rent Expense',       cr: 'Cash Account',       range: [8000,  30000]  },
  { dr: 'Bank Account',       cr: 'Accounts Rec.',      range: [4000,  20000]  },
  { dr: 'Prepaid Insurance',  cr: 'Cash Account',       range: [2000,  12000]  },
  { dr: 'Cash Account',       cr: 'Service Revenue',    range: [6000,  35000]  },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

// Generates a random date string within the past 30 days
function randomDate() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const daysBack = randInt(0, 29);
  const d = new Date(now);
  d.setDate(d.getDate() - daysBack);
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
}

// Generates N balanced double-entry pairs (so DR total === CR total per pair)
function generateEntries(count = 3) {
  const entries = [];
  const balances = [];
  let running = randInt(10000, 80000); // random starting balance

  // Shuffle ACCOUNT_PAIRS to avoid repeating the same pair back-to-back
  const shuffled = [...ACCOUNT_PAIRS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    const pair = shuffled[i % shuffled.length];
    const amount = randInt(pair.range[0], pair.range[1]);
    // Round to nearest 50 for a realistic look
    const rounded = Math.round(amount / 50) * 50;
    const date = randomDate();

    entries.push({ date, account: pair.dr, type: 'DR', amount: formatINR(rounded) });
    running -= rounded; // DR reduces balance
    balances.push(running);

    entries.push({ date, account: pair.cr, type: 'CR', amount: formatINR(rounded) });
    running += rounded; // CR restores — net zero per pair
    balances.push(running);
  }

  return { entries, balances };
}

// ─── Double-Entry Ledger Strip ────────────────────────────────────────────────
function DoubleEntryStrip({ shouldAnimate }) {
  const [{ entries, balances }, setData] = useState(() => generateEntries(3));
  const [visible, setVisible] = useState(0);
  const [cycleKey, setCycleKey] = useState(0); // forces AnimatePresence remount on new cycle
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const startCycle = useCallback(() => {
    // Generate a fresh set of entries for this cycle
    setData(generateEntries(3));
    setVisible(0);
    setCycleKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      setVisible(entries.length);
      return;
    }

    // Reveal one row every 800ms
    intervalRef.current = setInterval(() => {
      setVisible((v) => {
        if (v >= entries.length) {
          clearInterval(intervalRef.current);
          // After a 2.5s pause, restart with fresh random data
          timeoutRef.current = setTimeout(startCycle, 2500);
          return v;
        }
        return v + 1;
      });
    }, 800);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  // cycleKey triggers a fresh effect run on each new cycle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate, cycleKey]);

  return (
    <div
      className="w-full max-w-lg mx-auto border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden"
      style={{ backgroundColor: 'rgba(22,27,36,0.9)' }}
      aria-label="Double-entry ledger preview"
      aria-live="polite"
    >
      {/* Strip header */}
      <div className="grid grid-cols-[64px_1fr_48px_110px] gap-2 px-4 py-2.5 border-b border-[var(--color-border)]">
        {['Date', 'Account', 'Ref.', 'Amount'].map((h) => (
          <span key={h} className="eyebrow">{h}</span>
        ))}
      </div>

      {/* Entries — keyed by cycleKey so rows fade out cleanly on cycle reset */}
      <div className="divide-y divide-[var(--color-border)] min-h-[144px]">
        {entries.map((entry, i) => (
          <motion.div
            key={`${cycleKey}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={i < visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="grid grid-cols-[64px_1fr_48px_110px] gap-2 px-4 py-2.5 items-center"
          >
            <span className="font-mono text-xs text-[var(--color-slate)]">{entry.date}</span>
            <span className="text-xs text-[var(--color-paper)] font-[var(--font-body)] truncate">{entry.account}</span>
            <span
              className={[
                'font-mono text-xs font-semibold tracking-wider',
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

      {/* Running balance — animates to new value each time a row appears */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderTopColor: 'rgba(182,141,64,0.3)', backgroundColor: 'rgba(23,57,46,0.15)' }}
      >
        <span className="eyebrow">Running Balance</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={`${cycleKey}-bal-${visible}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.22 }}
            className="font-mono text-sm font-medium text-[#4ade80]"
          >
            {formatINR(Math.abs(balances[Math.max(0, visible - 1)] ?? balances[0] ?? 0))}
          </motion.span>
        </AnimatePresence>
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
