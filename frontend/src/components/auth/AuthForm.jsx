import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { loginSchema, registerSchema } from '../../lib/schemas';
import { useLogin, useRegister, useVerifyEmail, useResendOTP } from '../../hooks/useAuth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LedgerStamp from '../ui/LedgerStamp';
import OTPInput from './OTPInput';

// ─── helpers ──────────────────────────────────────────────────────────────
function getApiError(error) {
  return (
    error?.response?.data?.message ??
    error?.message ??
    'Something went wrong. Please try again.'
  );
}

const TABS = ['Log in', 'Sign up'];

// ─── OTP Step ─────────────────────────────────────────────────────────────
function OTPStep({ userId, email, onBack, onVerificationSuccess }) {
  const [otp, setOTP] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendOTP();

  function handleVerify(e) {
    e.preventDefault();
    if (otp.length !== 6) return;
    verifyMutation.mutate({ userId, otp });
  }

  function handleResend() {
    resendMutation.mutate(
      { userId },
      {
        onSuccess: () => {
          // 60-second cooldown
          setResendCooldown(60);
          const interval = setInterval(() => {
            setResendCooldown((c) => {
              if (c <= 1) { clearInterval(interval); return 0; }
              return c - 1;
            });
          }, 1000);
        },
      }
    );
  }

  const verifyError = verifyMutation.isError ? getApiError(verifyMutation.error) : null;
  const resendError = resendMutation.isError ? getApiError(resendMutation.error) : null;

  if (verifyMutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center text-center gap-5 py-6"
      >
        <LedgerStamp
          show
          label="VERIFIED"
          subLabel="Your email has been verified successfully."
        />
        
        <p className="text-xs text-[var(--color-slate-light)] leading-relaxed max-w-xs font-[var(--font-body)]">
          Your account is now active and balanced. Proceed to the login panel to sign in with your email and password.
        </p>

        <Button
          type="button"
          size="lg"
          className="w-full mt-4"
          onClick={onVerificationSuccess}
          id="go-to-login-btn"
        >
          Go to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-[var(--color-brass)]"
          style={{ backgroundColor: 'rgba(182,141,64,0.1)' }}>
          <Mail size={18} className="text-[var(--color-brass)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-paper)] font-[var(--font-body)]">
          Check your email
        </h2>
        <p className="text-xs text-[var(--color-slate-light)] leading-relaxed">
          We sent a 6-digit code to{' '}
          <span className="font-mono text-[var(--color-paper)]">{email}</span>.
          Enter it below. The code expires in 10 minutes.
        </p>
      </div>

      {/* OTP boxes */}
      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <OTPInput
          onChange={setOTP}
          disabled={verifyMutation.isPending}
        />

        {/* Errors */}
        <AnimatePresence>
          {(verifyError || resendError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs text-[var(--color-debit-light)]"
              style={{
                backgroundColor: 'rgba(155,59,59,0.12)',
                border: '1px solid rgba(155,59,59,0.3)',
                color: 'var(--color-debit-light)',
              }}
              role="alert"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {verifyError ?? resendError}
            </motion.div>
          )}

          {resendMutation.isSuccess && !resendMutation.isError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs text-[#4ade80]"
              style={{
                backgroundColor: 'rgba(23,57,46,0.3)',
                border: '1px solid rgba(23,57,46,0.6)',
              }}
              role="status"
            >
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              A new code has been sent to your email.
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          size="lg"
          disabled={otp.length !== 6 || verifyMutation.isPending}
          loading={verifyMutation.isPending}
        >
          Verify Email
        </Button>
      </form>

      {/* Resend + back */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-[var(--color-slate)] hover:text-[var(--color-slate-light)] transition-colors cursor-pointer"
        >
          ← Change email
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendMutation.isPending}
          className="flex items-center gap-1 text-[var(--color-brass)] hover:text-[var(--color-brass-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RefreshCw size={11} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main AuthForm ─────────────────────────────────────────────────────────
export default function AuthForm() {
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === 'true';

  // 'tabs' | 'otp'
  const [step, setStep] = useState('tabs');
  const [activeTab, setActiveTab] = useState(justVerified ? 'Log in' : 'Log in');
  const [pendingUser, setPendingUser] = useState(null); // { userId, email }

  const isLogin = activeTab === 'Log in';

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const mutation = isLogin ? loginMutation : registerMutation;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    mode: 'onTouched',
  });

  const watchedEmail = watch('email', '');

  function handleTabSwitch(tab) {
    setActiveTab(tab);
    setStep('tabs');
    setPendingUser(null);
    reset();
    loginMutation.reset();
    registerMutation.reset();
  }

  function onSubmit(data) {
    if (isLogin) {
      loginMutation.mutate(data, {
        onError: (err) => {
          // 403 = unverified — offer to go to OTP step
          if (err?.response?.status === 403 && err?.response?.data?.userId) {
            setPendingUser({ userId: err.response.data.userId, email: data.email });
            setStep('otp');
          }
        },
      });
    } else {
      registerMutation.mutate(data, {
        onSuccess: (result) => {
          // result = { message, userId }
          setPendingUser({ userId: result.userId, email: data.email });
          setStep('otp');
        },
      });
    }
  }

  // API error for the form step (not OTP step)
  const apiError = (() => {
    if (!mutation.isError) return null;
    // Suppress 403 Unverified from showing as a red error (we handle it by switching to OTP step)
    if (mutation.error?.response?.status === 403) return null;
    return getApiError(mutation.error);
  })();

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {/* ── OTP Step ── */}
        {step === 'otp' && pendingUser ? (
          <OTPStep
            key="otp"
            userId={pendingUser.userId}
            email={pendingUser.email}
            onBack={() => {
              setStep('tabs');
              setPendingUser(null);
              registerMutation.reset();
              loginMutation.reset();
            }}
            onVerificationSuccess={() => {
              setStep('tabs');
              setPendingUser(null);
              setActiveTab('Log in');
              registerMutation.reset();
              loginMutation.reset();
            }}
          />
        ) : (
          /* ── Login / Sign Up tabs ── */
          <motion.div
            key="tabs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Success banner — shown after email verification */}
            <AnimatePresence>
              {justVerified && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-2 p-3 mb-6 rounded-[var(--radius-sm)] text-xs text-[#4ade80]"
                  style={{
                    backgroundColor: 'rgba(23,57,46,0.3)',
                    border: '1px solid rgba(23,57,46,0.6)',
                  }}
                  role="status"
                >
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  Email verified! You can now log in with your credentials.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab toggle */}
            <div
              className="flex border-b border-[var(--color-border)] mb-8"
              role="tablist"
              aria-label="Authentication mode"
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  id={`tab-${tab.toLowerCase().replace(' ', '-')}`}
                  onClick={() => handleTabSwitch(tab)}
                  className={[
                    'relative px-1 pb-3 mr-7 text-sm font-[var(--font-body)] font-medium',
                    'transition-colors duration-150 cursor-pointer',
                    activeTab === tab
                      ? 'text-[var(--color-paper)]'
                      : 'text-[var(--color-slate)] hover:text-[var(--color-slate-light)]',
                  ].join(' ')}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-brass)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-5"
                aria-labelledby={`tab-${activeTab.toLowerCase().replace(' ', '-')}`}
              >
                {!isLogin && (
                  <Input
                    label="Full Name"
                    id="name"
                    type="text"
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                )}

                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  error={errors.password?.message}
                  {...register('password')}
                />

                {/* API error */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-xs text-[var(--color-debit-light)]"
                      style={{
                        backgroundColor: 'rgba(155,59,59,0.12)',
                        border: '1px solid rgba(155,59,59,0.3)',
                      }}
                      role="alert"
                    >
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      {apiError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  size="lg"
                  loading={mutation.isPending}
                  disabled={mutation.isPending}
                  className="mt-2"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>

                {/* Toggle hint */}
                <p className="text-center text-xs text-[var(--color-slate)]">
                  {isLogin ? "Don't have an account? " : 'Already registered? '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch(isLogin ? 'Sign up' : 'Log in')}
                    className="text-[var(--color-brass)] hover:underline cursor-pointer"
                  >
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
