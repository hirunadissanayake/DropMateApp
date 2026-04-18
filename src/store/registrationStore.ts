import { create } from 'zustand';

interface RegistrationData {
  fullName?: string;
  email?: string;
  phone?: string;
  nicNumber?: string;
  password?: string;
  confirmPassword?: string;
  roleRequested?: 'CUSTOMER' | 'TRAVELER';
  termsAccepted?: boolean;
  selfie?: any;
  nicFront?: any;
  nicBack?: any;
}

interface RegistrationState {
  data: RegistrationData;
  updateData: (data: Partial<RegistrationData>) => void;
  clearData: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  data: {},
  updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
  clearData: () => set({ data: {} }),
}));
