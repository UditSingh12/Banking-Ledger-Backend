import api from './axios';

/**
 * POST /api/account
 * Creates a new SAVINGS or CURRENT account.
 * @param {{ accountType: 'SAVINGS' | 'CURRENT', currency?: string }} data
 */
export async function createAccount(data) {
  const res = await api.post('/account', data);
  return res.data?.account ?? res.data;
}

/**
 * GET /api/account
 * Returns all accounts for the authenticated user.
 * @returns {Promise<Array>}
 */
export async function getAccounts() {
  const res = await api.get('/account');
  return res.data?.accounts ?? res.data ?? [];
}

/**
 * PATCH /api/account/:id/status
 * Changes an account's status.
 * @param {string} id
 * @param {'ACTIVE' | 'FROZEN' | 'CLOSED'} status
 */
export async function updateAccountStatus(id, status) {
  const res = await api.patch(`/account/${id}/status`, { status });
  return res.data;
}

/**
 * GET /api/account/:id/transactions
 * Fetches paginated + filtered transaction history for an account.
 * @param {string} accountId
 * @param {{ page?, limit?, status?, type?, direction?, startDate?, endDate? }} params
 */
export async function getTransactionHistory(accountId, params = {}) {
  const res = await api.get(`/account/${accountId}/transactions`, { params });
  return res.data;
}
