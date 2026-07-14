import api from './axios';

/**
 * POST /api/transaction/transfer
 * Initiates a fund transfer between two accounts.
 *
 * IMPORTANT: generate idempotencyKey with crypto.randomUUID() BEFORE the first
 * submit attempt, and reuse the same key on any automatic retries so a flaky
 * connection can't double-submit.
 *
 * @param {{ fromAccount: string, toAccount: string, amount: number, idempotencyKey: string }} data
 */
export async function transfer(data) {
  const res = await api.post('/transaction/transfer', data);
  return res.data;
}

/**
 * POST /api/transaction/:id/reverse
 * Requests a reversal of a completed transaction.
 * Only the original sender may do this.
 *
 * @param {string} transactionId
 * @param {string} [reason]
 */
export async function reverseTransaction(transactionId, reason) {
  const res = await api.post(`/transaction/${transactionId}/reverse`, { reason });
  return res.data;
}
