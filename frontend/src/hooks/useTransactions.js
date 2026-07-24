import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transfer, reverseTransaction, raiseDispute } from '../api/transaction.api';
import { getTransactionHistory } from '../api/account.api';

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useTransactionHistory(accountId, filters = {}, enabled = true) {
  return useQuery({
    queryKey: ['transactions', accountId, filters],
    queryFn: () => getTransactionHistory(accountId, filters),
    enabled: !!accountId && enabled,
    staleTime: 15_000,
  });
}

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

export function useRaiseDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, reason }) => raiseDispute(transactionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
