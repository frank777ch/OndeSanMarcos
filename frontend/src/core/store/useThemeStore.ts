import { create } from 'zustand';
import { primitive } from '@/theme/colors';

interface ThemeState {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  primaryColor: primitive.primary,
  setPrimaryColor: (color) => set({ primaryColor: color }),
}));
