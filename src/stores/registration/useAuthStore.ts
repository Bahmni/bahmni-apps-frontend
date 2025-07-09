import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: any; // Replace 'any' with a proper User interface
  setAuthenticated: (isAuthenticated: boolean, user: any) => void;
  clearAuthentication: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuthenticated: (isAuthenticated, user) => set({ isAuthenticated, user }),
  clearAuthentication: () => set({ isAuthenticated: false, user: null }),
}));
