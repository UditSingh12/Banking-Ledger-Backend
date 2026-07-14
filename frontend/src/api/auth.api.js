import api from './axios';

/**
 * POST /api/auth/register
 * Returns { message, userId } — does NOT log the user in.
 */
export async function register(data) {
  const res = await api.post('/auth/register', data);
  return res.data;
}

/**
 * POST /api/auth/verify-email
 * @param {{ userId: string, otp: string }} data
 */
export async function verifyEmail(data) {
  const res = await api.post('/auth/verify-email', data);
  return res.data;
}

/**
 * POST /api/auth/resend-otp
 * @param {{ userId: string }} data
 */
export async function resendOTP(data) {
  const res = await api.post('/auth/resend-otp', data);
  return res.data;
}

/**
 * POST /api/auth/login
 * Returns { _id, email, name, expiresAt } on success.
 * Throws 403 with userId if unverified.
 * Throws 423 with lockedUntil if account is locked.
 */
export async function login(data) {
  const res = await api.post('/auth/login', data);
  return res.data;
}

/**
 * POST /api/auth/logout (protected)
 * Increments tokenVersion server-side to invalidate the current token.
 */
export async function logout() {
  const res = await api.post('/auth/logout');
  return res.data;
}

/**
 * POST /api/auth/change-password (protected)
 * @param {{ currentPassword: string, newPassword: string }} data
 */
export async function changePassword(data) {
  const res = await api.post('/auth/change-password', data);
  return res.data;
}
