import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: [
    'bg-[var(--color-brass)] text-[var(--color-ink)]',
    'hover:bg-[var(--color-brass-light)]',
    'font-semibold',
  ],
  secondary: [
    'bg-transparent border border-[var(--color-brass)] text-[var(--color-brass)]',
    'hover:bg-[var(--color-brass)] hover:text-[var(--color-ink)]',
    'font-semibold',
  ],
  ghost: [
    'bg-transparent text-[var(--color-slate-light)]',
    'hover:text-[var(--color-paper)]',
  ],
  danger: [
    'bg-transparent border border-[var(--color-debit)] text-[var(--color-debit)]',
    'hover:bg-[var(--color-debit)] hover:text-white',
  ],
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    ...props
  },
  ref
) {
  const variantClasses = (variants[variant] ?? variants.primary).join(' ');
  const sizeClasses = sizes[size] ?? sizes.md;

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-[var(--radius-sm)] tracking-wide',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'cursor-pointer select-none font-[var(--font-body)]',
        variantClasses,
        sizeClasses,
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
});

export default Button;
