import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { setActiveRole } from "./api-client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        // Activate role-scoped token isolation BEFORE any API calls
        setActiveRole(user.role);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        setActiveRole(null);
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "investo-auth",
      // Rehydrate the active role from persisted state on page load
      onRehydrateStorage: () => (state) => {
        if (state?.user?.role) {
          setActiveRole(state.user.role);
        }
      },
    }
  )
);
