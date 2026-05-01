import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  searchHistory: string[];
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set) => ({
      theme: 'system',
      searchHistory: [],
      setTheme: (theme) => set((state) => { state.theme = theme; }),
      addToHistory: (query) => set((state) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        state.searchHistory = state.searchHistory.filter(q => q !== trimmed);
        state.searchHistory.unshift(trimmed);
        if (state.searchHistory.length > 10) {
          state.searchHistory.pop();
        }
      }),
      removeFromHistory: (query) => set((state) => {
        state.searchHistory = state.searchHistory.filter(q => q !== query);
      }),
      clearHistory: () => set((state) => {
        state.searchHistory = [];
      }),
    })),
    { name: 'ui', storage: createJSONStorage(() => AsyncStorage) }
  )
);
