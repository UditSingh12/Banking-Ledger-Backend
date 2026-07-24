import api from './axios';

export async function register(data) {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function verifyEmail(data) {
  const res = await api.post('/auth/verify-email', data);
  return res.data;
}

export async function resendOTP(data) {
  const res = await api.post('/auth/resend-otp', data);
  return res.data;
}

export async function login(data) {
  const res = await api.post('/auth/login', data);
  return res.data;
}

export async function logout() {
  const res = await api.post('/auth/logout');
  return res.data;
}

export async function changePassword(data) {
  const res = await api.post('/auth/change-password', data);
  return res.data;
}

// ── 2FA / TOTP ──────────────────────────────────────────────────────────────

/** POST /api/auth/2fa/setup — returns { secret, otpAuthUrl } */
export async function setup2FA() {
  const res = await api.post('/auth/2fa/setup');
  return res.data;
}

/** POST /api/auth/2fa/confirm — { totpCode } → enables 2FA */
export async function confirm2FA(data) {
  const res = await api.post('/auth/2fa/confirm', data);
  return res.data;
}

/** POST /api/auth/2fa/disable — { totpCode } → disables 2FA */
export async function disable2FA(data) {
  const res = await api.post('/auth/2fa/disable', data);
  return res.data;
}

/** POST /api/auth/2fa/verify-step-up — { totpCode } → { verified: true } */
export async function verifyStepUp(data) {
  const res = await api.post('/auth/2fa/verify-step-up', data);
  return res.data;
}
