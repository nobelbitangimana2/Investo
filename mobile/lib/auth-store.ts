import { create } from 'zustand';
import type { User } from '@/types';
import { setActiveRole } from './api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => {
    setActiveRole(user.role);
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    setActiveRole(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
