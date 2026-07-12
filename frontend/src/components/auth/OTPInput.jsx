import { useRef, useState } from 'react';

/**
 * OTPInput — 6-box OTP entry field.
 * - Auto-focuses next box on digit entry
 * - Backspace moves to previous box
 * - Paste fills all 6 boxes at once
 * - Calls onChange(sixDigitString) whenever the value changes
 */
export default function OTPInput({ onChange, disabled = false }) {
  const [digits, setDigits] = useState(Array(6).fill(''));
  const inputs = useRef([]);

  function update(newDigits) {
    setDigits(newDigits);
    onChange(newDigits.join(''));
  }

  function handleChange(e, idx) {
    const val = e.target.value.replace(/\D/g, '').slice(-1); // digits only, max 1
    const next = [...digits];
    next[idx] = val;
    update(next);
    if (val && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        update(next);
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
        const next = [...digits];
        next[idx - 1] = '';
        update(next);
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    update(next);
    // Focus the next empty box or the last one
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex items-center gap-2 justify-center" role="group" aria-label="One-time password input">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${idx + 1}`}
          className={[
            'w-11 h-14 text-center text-xl font-mono font-medium',
            'bg-[var(--color-ink-soft)] text-[var(--color-paper)]',
            'border rounded-[var(--radius-sm)]',
            'transition-colors duration-150',
            'disabled:opacity-40',
            digit
              ? 'border-[var(--color-brass)] text-[var(--color-brass)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-brass)]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
