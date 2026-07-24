import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth store — persists only non-sensitive display data (name, email, role).
 * The JWT itself is stored in an HTTP-only cookie by the backend.
 * We never touch the token on the frontend.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,           // { _id, name, email, role, twoFactorEnabled }
      isAuthenticated: false,

      // Actions
      setAuth: (user) =>
        set({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role ?? 'USER',
            twoFactorEnabled: user.twoFactorEnabled ?? false,
          },
          isAuthenticated: true,
        }),

      // Update 2FA enabled flag without full re-login
      set2FAEnabled: (enabled) =>
        set((state) => ({
          user: state.user ? { ...state.user, twoFactorEnabled: enabled } : null,
        })),

      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ledger-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
