import { motion } from 'framer-motion';
import {
  Layers,
  ShieldCheck,
  RefreshCw,
  Lock,
  CreditCard,
  Activity,
} from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Multiple Ledger Accounts',
    body: 'Open multiple accounts per user — INR, USD, EUR, GBP — each with its own ledger history and status controls.',
  },
  {
    icon: RefreshCw,
    title: 'Idempotent Transactions',
    body: 'Every fund movement is tagged with a unique idempotency key, so retries and double-clicks never create duplicate entries.',
  },
  {
    icon: ShieldCheck,
    title: 'Cookie-Based Sessions',
    body: 'JWTs live exclusively in HTTP-only cookies. Your credentials never touch localStorage or frontend state.',
  },
  {
    icon: Activity,
    title: 'Account Status Controls',
    body: 'Accounts can be ACTIVE, FROZEN, or CLOSED — giving you granular control over fund availability at any time.',
  },
  {
    icon: Lock,
    title: 'Protected by Default',
    body: 'All account and transaction endpoints sit behind JWT middleware — no unauthenticated access, ever.',
  },
  {
    icon: CreditCard,
    title: 'Double-Entry Foundation',
    body: 'Built on a schema that tracks both fromAccount and toAccount, keeping every debit balanced by a corresponding credit.',
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function Features() {
  return (
    <section
      id="features"
      className="py-28 px-6"
      style={{ backgroundColor: 'var(--color-ink-soft)' }}
      aria-labelledby="features-heading"
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-16">

        {/* Section header */}
        <div className="flex flex-col gap-4">
          <p className="eyebrow text-[var(--color-brass)]">What's inside</p>
          <h2
            id="features-heading"
            className="text-3xl md:text-4xl font-light text-[var(--color-paper)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Built around the ledger — not just the look.
          </h2>
          <p className="text-[var(--color-slate-light)] max-w-lg text-sm leading-relaxed">
            Every feature below reflects an actual capability of the backend API.
            No filler. No generic "bank-like" marketing copy.
          </p>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
        >
          {features.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="flex flex-col gap-4 p-7 group"
              style={{ backgroundColor: 'var(--color-ink)', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-brass)] group-hover:border-[var(--color-brass)] transition-colors duration-200">
                <Icon size={16} />
              </span>
              <h3
                className="text-sm font-semibold text-[var(--color-paper)] font-[var(--font-body)]"
              >
                {title}
              </h3>
              <p className="text-xs text-[var(--color-slate-light)] leading-relaxed">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
