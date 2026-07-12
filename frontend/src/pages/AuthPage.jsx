import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthForm from '../components/auth/AuthForm';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  // If already authenticated, skip to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-20 ledger-ruled"
      style={{ backgroundColor: 'var(--color-ink)' }}
    >
      <div className="w-full max-w-md flex flex-col gap-10">

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block w-5 h-[1.5px] bg-[var(--color-brass)]" />
            <span className="block w-3 h-[1.5px] bg-[var(--color-brass)] opacity-60" />
            <span className="block w-5 h-[1.5px] bg-[var(--color-brass)]" />
          </span>
          <span className="font-mono text-sm tracking-widest uppercase text-[var(--color-paper)]">
            Ledger
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col gap-2"
        >
          <h1
            className="text-3xl font-light text-[var(--color-paper)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your ledger awaits.
          </h1>
          <p className="text-sm text-[var(--color-slate-light)]">
            Sign in or create an account to manage your entries.
          </p>
        </motion.div>

        {/* Auth form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <AuthForm />
        </motion.div>
      </div>
    </div>
  );
}
