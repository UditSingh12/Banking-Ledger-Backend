import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminListUsers, adminUnlockUser,
  adminListTransactions,
  adminFlagAccount,
  adminListDisputes, adminResolveDispute,
} from '../api/admin.api';

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminListUsers(params),
    staleTime: 30_000,
  });
}

export function useAdminUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminUnlockUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminTransactions(params = {}) {
  return useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: () => adminListTransactions(params),
    staleTime: 15_000,
  });
}

export function useAdminFlagAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }) => adminFlagAccount(accountId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminDisputes(params = {}) {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: () => adminListDisputes(params),
    staleTime: 15_000,
  });
}

export function useAdminResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, data }) => adminResolveDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
