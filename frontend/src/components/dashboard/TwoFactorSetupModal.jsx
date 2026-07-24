import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ShieldCheck, ShieldOff, AlertCircle, Copy, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useSetup2FA, useConfirm2FA, useDisable2FA } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/useAuthStore';

function OTPInput({ value, onChange }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      className="w-full text-center text-2xl tracking-[0.5em] py-3 px-4 bg-transparent border rounded-[var(--radius-sm)] font-mono outline-none transition-colors"
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-paper)',
        caretColor: 'var(--color-brass)',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'var(--color-brass)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
      autoFocus
    />
  );
}

export default function TwoFactorSetupModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const twoFactorEnabled = user?.twoFactorEnabled ?? false;

  const [phase, setPhase] = useState('idle'); // idle | setup | confirm | done | disable
  const [qrData, setQrData] = useState(null); // { secret, otpAuthUrl }
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { mutate: startSetup, isPending: loadingSetup } = useSetup2FA();
  const { mutate: confirmSetup, isPending: loadingConfirm, isError: confirmError, error: confirmErr } = useConfirm2FA();
  const { mutate: doDisable, isPending: loadingDisable, isError: disableError, error: disableErr } = useDisable2FA();

  function handleClose() {
    setPhase('idle');
    setQrData(null);
    setCode('');
    onClose();
  }

  function handleStart() {
    startSetup(undefined, {
      onSuccess: (data) => {
        setQrData(data);
        setPhase('setup');
      },
    });
  }

  function handleConfirm() {
    confirmSetup({ totpCode: code }, {
      onSuccess: () => setPhase('done'),
    });
  }

  function handleDisableSubmit() {
    doDisable({ totpCode: code }, {
      onSuccess: () => {
        setPhase('idle');
        setCode('');
        onClose();
      },
    });
  }

  function copySecret() {
    if (qrData?.secret) {
      navigator.clipboard.writeText(qrData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const getError = (err) => err?.response?.data?.message ?? err?.message ?? 'Something went wrong.';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Two-Factor Authentication">
      <AnimatePresence mode="wait">
        {/* ── Idle — show current state ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
            <div
              className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] border"
              style={{
                borderColor: twoFactorEnabled ? 'rgba(74,222,128,0.3)' : 'var(--color-border)',
                backgroundColor: twoFactorEnabled ? 'rgba(23,57,46,0.3)' : 'var(--color-ink)',
              }}
            >
              {twoFactorEnabled
                ? <ShieldCheck size={28} style={{ color: '#4ade80' }} className="shrink-0" />
                : <ShieldOff size={28} style={{ color: 'var(--color-slate)' }} className="shrink-0" />
              }
              <div>
                <p className="font-mono text-sm font-semibold" style={{ color: twoFactorEnabled ? '#4ade80' : 'var(--color-slate-light)' }}>
                  {twoFactorEnabled ? '2FA is enabled' : '2FA is not enabled'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-slate)' }}>
                  {twoFactorEnabled
                    ? 'Your account is protected with a time-based one-time password.'
                    : 'Add an extra layer of security to your account.'}
                </p>
              </div>
            </div>

            {twoFactorEnabled ? (
              <Button variant="danger" onClick={() => { setCode(''); setPhase('disable'); }} className="w-full">
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleStart} loading={loadingSetup} className="w-full gap-2">
                <QrCode size={15} /> Set Up Authenticator App
              </Button>
            )}
          </motion.div>
        )}

        {/* ── Setup — show QR code ── */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex flex-col gap-5">
            <p className="eyebrow" style={{ color: 'var(--color-brass)' }}>Step 1 — Scan QR Code</p>
            <p className="text-xs" style={{ color: 'var(--color-slate)' }}>
              Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.
            </p>

            {/* QR code rendered as a link to scan */}
            <div
              className="flex items-center justify-center p-4 rounded-[var(--radius-md)] border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ink)' }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData?.otpAuthUrl ?? '')}&bgcolor=0B0E13&color=B68D40`}
                alt="QR Code for authenticator app"
                width={180}
                height={180}
                className="rounded"
              />
            </div>

            <div>
              <p className="eyebrow mb-1" style={{ color: 'var(--color-slate-light)' }}>Manual Entry Key</p>
              <div
                className="flex items-center gap-2 p-2.5 rounded-[var(--radius-sm)] border font-mono text-xs"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ink)', color: 'var(--color-brass)' }}
              >
                <span className="flex-1 break-all">{qrData?.secret}</span>
                <button onClick={copySecret} className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  {copied ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="ghost" size="sm" onClick={() => setPhase('idle')}>← Back</Button>
              <Button size="sm" onClick={() => { setCode(''); setPhase('confirm'); }}>
                I've Scanned It →
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Confirm — enter code ── */}
        {phase === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex flex-col gap-5">
            <p className="eyebrow" style={{ color: 'var(--color-brass)' }}>Step 2 — Verify Code</p>
            <p className="text-xs" style={{ color: 'var(--color-slate)' }}>
              Enter the 6-digit code from your authenticator app to confirm setup.
            </p>
            <OTPInput value={code} onChange={setCode} />

            {confirmError && (
              <div className="flex items-center gap-2 text-xs p-2.5 rounded-[var(--radius-sm)]"
                style={{ backgroundColor: 'rgba(155,59,59,0.12)', border: '1px solid rgba(155,59,59,0.3)', color: 'var(--color-debit-light)' }}>
                <AlertCircle size={13} className="shrink-0" />
                {getError(confirmErr)}
              </div>
            )}

            <div className="flex gap-3 justify-between">
              <Button variant="ghost" size="sm" onClick={() => setPhase('setup')}>← Back</Button>
              <Button size="sm" onClick={handleConfirm} loading={loadingConfirm} disabled={code.length !== 6}>
                <ShieldCheck size={14} /> Enable 2FA
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Done ── */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-4 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: '#4ade80', backgroundColor: 'rgba(23,57,46,0.4)' }}
            >
              <ShieldCheck size={32} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-paper)' }}>2FA Enabled</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-slate)' }}>
                Your account is now protected. You'll need your authenticator for large transfers.
              </p>
            </div>
            <Button size="sm" onClick={handleClose} className="mt-2">Done</Button>
          </motion.div>
        )}

        {/* ── Disable flow ── */}
        {phase === 'disable' && (
          <motion.div key="disable" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex flex-col gap-5">
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs"
              style={{ backgroundColor: 'rgba(155,59,59,0.1)', border: '1px solid rgba(155,59,59,0.25)', color: 'var(--color-debit-light)' }}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              Disabling 2FA will reduce the security of your account.
            </div>
            <p className="text-xs" style={{ color: 'var(--color-slate)' }}>
              Enter your current authenticator code to confirm.
            </p>
            <OTPInput value={code} onChange={setCode} />

            {disableError && (
              <div className="flex items-center gap-2 text-xs p-2.5 rounded-[var(--radius-sm)]"
                style={{ backgroundColor: 'rgba(155,59,59,0.12)', border: '1px solid rgba(155,59,59,0.3)', color: 'var(--color-debit-light)' }}>
                <AlertCircle size={13} className="shrink-0" />
                {getError(disableErr)}
              </div>
            )}

            <div className="flex gap-3 justify-between">
              <Button variant="ghost" size="sm" onClick={() => setPhase('idle')}>← Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDisableSubmit} loading={loadingDisable} disabled={code.length !== 6}>
                Disable 2FA
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
