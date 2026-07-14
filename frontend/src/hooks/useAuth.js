import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, register, verifyEmail, resendOTP, changePassword, logout } from '../api/auth.api';
import { useAuthStore } from '../store/useAuthStore';

/**
 * useLogin — authenticates the user and sets auth store.
 * Handles the 403 "Unverified" case and 423 "Locked" case in the component.
 */
export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      navigate('/dashboard');
    },
    // 403 and 423 are handled in the component (not auto-navigated)
  });
}

/**
 * useRegister — creates an unverified account.
 * Returns { message, userId } for the OTP step.
 */
export function useRegister() {
  return useMutation({
    mutationFn: register,
  });
}

/**
 * useVerifyEmail — submits the 6-digit OTP.
 * On success, navigates to /auth?verified=true.
 */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: verifyEmail,
  });
}

/**
 * useResendOTP — requests a fresh OTP for the given userId.
 */
export function useResendOTP() {
  return useMutation({
    mutationFn: resendOTP,
  });
}

/**
 * useChangePassword — changes the password for the logged-in user.
 * After success, clears auth (server also invalidates the token).
 */
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

/**
 * useLogout — server-side token invalidation + local auth clear.
 */
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Always clear local state even if the API call fails
      clearAuth();
      queryClient.clear();
      navigate('/', { replace: true });
    },
  });
}
