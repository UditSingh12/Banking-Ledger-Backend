import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  login, register, verifyEmail, resendOTP, changePassword, logout,
  setup2FA, confirm2FA, disable2FA, verifyStepUp,
} from '../api/auth.api';
import { useAuthStore } from '../store/useAuthStore';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      navigate('/dashboard');
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyEmail });
}

export function useResendOTP() {
  return useMutation({ mutationFn: resendOTP });
}

export function useChangePassword() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      clearAuth();
      navigate('/auth');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate('/', { replace: true });
    },
  });
}

// ── 2FA hooks ──────────────────────────────────────────────────────────────

/** Returns { secret, otpAuthUrl } so the component can render the QR code */
export function useSetup2FA() {
  return useMutation({ mutationFn: setup2FA });
}

/** Confirms the TOTP code, enables 2FA on the account */
export function useConfirm2FA() {
  const set2FAEnabled = useAuthStore((s) => s.set2FAEnabled);
  return useMutation({
    mutationFn: confirm2FA,
    onSuccess: () => set2FAEnabled(true),
  });
}

/** Disables 2FA after verifying a TOTP code */
export function useDisable2FA() {
  const set2FAEnabled = useAuthStore((s) => s.set2FAEnabled);
  return useMutation({
    mutationFn: disable2FA,
    onSuccess: () => set2FAEnabled(false),
  });
}

/** Step-up verification — used by transfer wizard for large amounts */
export function useVerifyStepUp() {
  return useMutation({ mutationFn: verifyStepUp });
}
