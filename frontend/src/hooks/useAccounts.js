import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, createAccount } from '../api/account.api';

const ACCOUNTS_KEY = ['accounts'];

/**
 * Fetches the user's accounts.
 *
 * NOTE: GET /api/account does not yet exist on the backend.
 * The error is handled gracefully — the component checks `isBackendPending`
 * and shows a quiet inline notice instead of crashing.
 */
export function useAccounts() {
  const query = useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: getAccounts,
    retry: false,           // Don't retry — 404 means route doesn't exist yet
    staleTime: 30_000,
  });

  // Distinguish between "route not yet implemented" vs real errors
  const isBackendPending =
    query.isError &&
    (query.error?.response?.status === 404 ||
      query.error?.response?.status === 405);

  return { ...query, isBackendPending };
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      // Invalidate accounts list so it refetches once backend adds GET /account
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
