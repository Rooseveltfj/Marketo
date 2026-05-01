import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  favoriteIds: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setFavorites: (ids: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    immer((set, get) => ({
      favoriteIds: [],
      addFavorite: (id) => set((state) => {
        if (!state.favoriteIds.includes(id)) {
          state.favoriteIds.push(id);
        }
      }),
      removeFavorite: (id) => set((state) => {
        state.favoriteIds = state.favoriteIds.filter(favId => favId !== id);
      }),
      toggleFavorite: (id) => set((state) => {
        if (state.favoriteIds.includes(id)) {
          state.favoriteIds = state.favoriteIds.filter(favId => favId !== id);
        } else {
          state.favoriteIds.push(id);
        }
      }),
      isFavorite: (id) => get().favoriteIds.includes(id),
      setFavorites: (ids) => set((state) => {
        state.favoriteIds = ids;
      }),
    })),
    { name: 'favorites', storage: createJSONStorage(() => AsyncStorage) }
  )
);
