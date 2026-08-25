import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '@/constants/config';

type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  input: string;
}

const LIGHT: ThemeColors = {
  background: COLORS.gray50,
  surface: COLORS.white,
  surfaceMuted: '#f3f4f6',
  border: COLORS.gray200,
  text: COLORS.gray900,
  textMuted: COLORS.gray500,
  textSubtle: COLORS.gray400,
  primary: COLORS.navy,
  input: COLORS.white,
};

const DARK: ThemeColors = {
  background: '#070d1a',
  surface: '#101a2b',
  surfaceMuted: '#18243a',
  border: '#263653',
  text: '#f3f6fb',
  textMuted: '#aab7ca',
  textSubtle: '#8190a8',
  primary: '#6f96ff',
  input: '#0d1728',
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemTheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem('investo-theme').then((stored) => {
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    colors: theme === 'dark' ? DARK : LIGHT,
    toggleTheme: () => setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('investo-theme', next);
      return next;
    }),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

export function themeColors(theme: Theme): ThemeColors {
  return theme === 'dark' ? DARK : LIGHT;
}
