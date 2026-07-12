import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 md:px-12 h-16"
      style={{
        backgroundColor: 'rgba(11,14,19,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(176,141,64,0.1)',
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 group no-underline"
        aria-label="Backend Ledger home"
      >
        {/* Ledger mark — two overlapping horizontal lines */}
        <span
          className="flex flex-col gap-[3px] justify-center"
          aria-hidden="true"
        >
          <span className="block w-5 h-[1.5px] bg-[var(--color-brass)]" />
          <span className="block w-3 h-[1.5px] bg-[var(--color-brass)] opacity-60" />
          <span className="block w-5 h-[1.5px] bg-[var(--color-brass)]" />
        </span>
        <span
          className="text-sm font-semibold tracking-widest uppercase font-[var(--font-mono)] text-[var(--color-paper)]"
        >
          Ledger
        </span>
      </Link>

      {/* CTA */}
      <Link to="/auth" tabIndex={-1}>
        <Button variant="secondary" size="sm">
          Login / Sign Up
        </Button>
      </Link>
    </motion.nav>
  );
}
