import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth store — persists only non-sensitive display data (name, email).
 * The JWT itself is stored in an HTTP-only cookie by the backend.
 * We never touch the token on the frontend.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,           // { _id, name, email }
      isAuthenticated: false,

      // Actions
      setAuth: (user) =>
        set({
          user: { _id: user._id, name: user.name, email: user.email },
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ledger-auth',  // localStorage key
      // Only persist the safe, non-sensitive fields
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
