import api from './axios';

/**
 * POST /api/transaction/transfer
 * IMPORTANT: generate idempotencyKey with crypto.randomUUID() BEFORE the first
 * submit attempt, and reuse the same key on any automatic retries.
 */
export async function transfer(data) {
  const res = await api.post('/transaction/transfer', data);
  return res.data;
}

/**
 * POST /api/transaction/:id/reverse
 */
export async function reverseTransaction(transactionId, reason) {
  const res = await api.post(`/transaction/${transactionId}/reverse`, { reason });
  return res.data;
}

/**
 * POST /api/transaction/:id/dispute
 * @param {string} transactionId
 * @param {string} reason — at least 10 characters
 */
export async function raiseDispute(transactionId, reason) {
  const res = await api.post(`/transaction/${transactionId}/dispute`, { reason });
  return res.data;
}
