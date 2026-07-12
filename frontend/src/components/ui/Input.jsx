import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="eyebrow text-[var(--color-slate-light)]"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'w-full bg-[var(--color-ink-soft)] text-[var(--color-paper)]',
          'border rounded-[var(--radius-sm)]',
          'px-4 py-3 text-sm font-[var(--font-body)]',
          'placeholder:text-[var(--color-slate)]',
          'transition-colors duration-150',
          error
            ? 'border-[var(--color-debit)] focus:outline-none focus:border-[var(--color-debit-light)]'
            : 'border-[var(--color-border)] focus:outline-none focus:border-[var(--color-brass)]',
          className,
        ].join(' ')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-[var(--color-debit-light)] font-[var(--font-body)]"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--color-slate)] font-[var(--font-body)]">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
