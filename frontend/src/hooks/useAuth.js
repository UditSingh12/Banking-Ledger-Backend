import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, register, verifyEmail, resendOTP, changePassword } from '../api/auth.api';
import { useAuthStore } from '../store/useAuthStore';

/**
 * useLogin — authenticates the user and sets auth store.
 * Handles the 403 "Unverified" case by returning the userId
 * so the component can redirect to the OTP screen.
 */
export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setAuth(user);
      navigate('/dashboard');
    },
    // 403 is handled in the component (not a mutation-level error we auto-navigate on)
  });
}

/**
 * useRegister — creates an unverified account.
 * Does NOT log the user in or navigate.
 * Returns { message, userId } for the OTP step.
 */
export function useRegister() {
  return useMutation({
    mutationFn: register,
    // Navigation is handled by AuthForm based on returned userId
  });
}

/**
 * useVerifyEmail — submits the 6-digit OTP.
 * On success, navigates to /auth?verified=true so the login tab
 * can show a success banner.
 */
export function useVerifyEmail() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      navigate('/auth?verified=true');
    },
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
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
