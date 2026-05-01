import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: (user) => set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      }),
      setLoading: (loading) => set((state) => { state.isLoading = loading; }),
      setError: (error) => set((state) => { state.error = error; }),
      clearError: () => set((state) => { state.error = null; }),
      logout: () => set((state) => {
        state.user = null;
        state.isAuthenticated = false;
      }),
    })),
    { name: 'auth', storage: createJSONStorage(() => AsyncStorage) }
  )
);
