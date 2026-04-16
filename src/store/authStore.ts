import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  roleActive: 'CUSTOMER' | 'TRAVELER' | null;
  isCustomerApproved: boolean;
  isTravelerApproved: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setRoleActive: (role: 'CUSTOMER' | 'TRAVELER') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true, 
  setAuth: (token, user) => set({ token, user, isLoading: false }),
  logout: () => set({ token: null, user: null, isLoading: false }),
  setRoleActive: (role) => 
    set((state) => ({
      user: state.user ? { ...state.user, roleActive: role } : null
    })),
}));
