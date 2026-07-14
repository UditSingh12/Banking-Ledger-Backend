import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transfer, reverseTransaction } from '../api/transaction.api';
import { getTransactionHistory } from '../api/account.api';

/**
 * useTransfer — initiates a fund transfer.
 * The idempotencyKey should be generated with crypto.randomUUID() before
 * the first submit and reused on any retry (held in TransferFlow state).
 */
export function useTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfer,
    onSuccess: () => {
      // Refresh accounts (balances changed) and any open transaction lists
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * useTransactionHistory — paginated + filtered transaction history.
 * @param {string} accountId
 * @param {object} filters — { page, limit, status, type, direction, startDate, endDate }
 * @param {boolean} [enabled=true]
 */
export function useTransactionHistory(accountId, filters = {}, enabled = true) {
  return useQuery({
    queryKey: ['transactions', accountId, filters],
    queryFn: () => getTransactionHistory(accountId, filters),
    enabled: !!accountId && enabled,
    staleTime: 15_000,
  });
}

/**
 * useReverseTransaction — reverses a completed transfer.
 */
export function useReverseTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, reason }) => reverseTransaction(transactionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
