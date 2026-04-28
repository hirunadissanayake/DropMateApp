import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  selfieUrl: string | null;
  nicFrontUrl: string | null;
  nicBackUrl: string | null;
  nicNumber: string;
  permanentAddress: string | null;
  city: string | null;
  weightCapacity: number | string | null;
  vehicleType: string | null;
  termsAccepted: boolean;
  isCustomerRequested: boolean;
  isTravelerRequested: boolean;
  isCustomerApproved: boolean;
  isTravelerApproved: boolean;
  rejectionReason: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  roleActive: 'CUSTOMER' | 'TRAVELER' | null;
  rating: number;
  trustScore: number;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setRoleActive: (role: 'CUSTOMER' | 'TRAVELER') => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      _hasHydrated: false,
      setAuth: (token, user) => set({ token, user, isLoading: false }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isLoading: false }),
      setRoleActive: (role) => 
        set((state) => ({
          user: state.user ? { ...state.user, roleActive: role } : null
        })),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'dropmate-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

