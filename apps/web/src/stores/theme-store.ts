import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  accentColor: string;

  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: '#3b82f6',

      setTheme: (theme: Theme) => set({ theme }),
      setAccentColor: (color: string) => set({ accentColor: color }),
    }),
    { name: 'commodity-monitor-theme' },
  ),
);
