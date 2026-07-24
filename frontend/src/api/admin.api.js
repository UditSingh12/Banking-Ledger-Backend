import api from './axios';

// ── Users ─────────────────────────────────────────────────────────────────────

export async function adminListUsers(params = {}) {
  const res = await api.get('/admin/users', { params });
  return res.data;
}

export async function adminUnlockUser(userId) {
  const res = await api.post(`/admin/users/${userId}/unlock`);
  return res.data;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function adminListTransactions(params = {}) {
  const res = await api.get('/admin/transactions', { params });
  return res.data;
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export async function adminFlagAccount(accountId, data) {
  const res = await api.post(`/admin/accounts/${accountId}/flag`, data);
  return res.data;
}

// ── Disputes ──────────────────────────────────────────────────────────────────

export async function adminListDisputes(params = {}) {
  const res = await api.get('/admin/disputes', { params });
  return res.data;
}

export async function adminResolveDispute(disputeId, data) {
  const res = await api.post(`/admin/disputes/${disputeId}/resolve`, data);
  return res.data;
}
