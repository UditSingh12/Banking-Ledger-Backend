import api from './axios';

/**
 * POST /api/account
 * Creates a new ledger account for the authenticated user.
 *
 * idempotencyKey MUST be generated client-side with crypto.randomUUID()
 * on every form submit to prevent duplicate account creation on retry/double-click.
 *
 * @param {{ currency: string, idempotencyKey: string }} data
 * @returns {Promise<{ _id: string, user: string, status: string, currency: string }>}
 */
export async function createAccount(data) {
  const res = await api.post('/account', data);
  return res.data?.account ?? res.data;
}

/**
 * GET /api/account
 * Returns all accounts for the authenticated user.
 *
 * NOTE: This route does not yet exist on the backend.
 * The dashboard handles the resulting error gracefully — it shows an inline
 * notice rather than crashing. Once the backend adds this route, it will
 * work automatically without any frontend changes.
 *
 * @returns {Promise<Array<{ _id: string, user: string, status: string, currency: string }>>}
 */
export async function getAccounts() {
  const res = await api.get('/account');
  return res.data?.accounts ?? res.data ?? [];
}
