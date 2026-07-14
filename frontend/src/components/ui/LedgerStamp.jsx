import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

/**
 * LedgerStamp — animated "CLEARED" stamp effect used after successful
 * transfers and account creation. Ties back to the hero's ledger metaphor.
 *
 * Usage:
 *   <LedgerStamp show={isSuccess} label="CLEARED" />
 */
export default function LedgerStamp({ show, label = 'CLEARED', subLabel }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="stamp"
          initial={{ opacity: 0, scale: 1.4, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="flex flex-col items-center gap-3 py-8 select-none"
        >
          {/* Outer ring — the "stamp" border */}
          <div
            className="relative flex items-center justify-center w-28 h-28 rounded-full border-4"
            style={{ borderColor: 'var(--color-brass)', opacity: 0.92 }}
          >
            {/* Inner double ring detail */}
            <div
              className="absolute inset-2 rounded-full border"
              style={{ borderColor: 'rgba(182,141,64,0.35)' }}
            />
            <CheckCircle2
              size={40}
              className="relative z-10"
              style={{ color: 'var(--color-brass)' }}
            />
          </div>

          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="font-mono text-base font-semibold tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-brass)' }}
          >
            {label}
          </motion.p>

          {subLabel && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="text-xs text-center max-w-xs"
              style={{ color: 'var(--color-slate-light)' }}
            >
              {subLabel}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
