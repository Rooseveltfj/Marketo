import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'user-theme-preference';

export const palette = {
  light: {
    primary: '#6C47FF',
    primaryLight: '#EDE9FF',
    primaryDark: '#4F2FD4',
    secondary: '#FF6B35',
    secondaryLight: '#FFF0EB',
    success: '#00C48C',
    successLight: '#E6FAF5',
    warning: '#FFB800',
    warningLight: '#FFF8E6',
    error: '#FF4D4F',
    errorLight: '#FFF1F0',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceHover: '#F5F4FF',
    border: '#EBEBEB',
    borderFocus: '#6C47FF',
    textPrimary: '#0D0D0D',
    textSecondary: '#6B6B6B',
    textTertiary: '#ABABAB',
    textInverse: '#FFFFFF',
  },
  dark: {
    primary: '#8B6FFF',
    primaryLight: '#1E1A3A',
    primaryDark: '#6C47FF',
    secondary: '#FF8C5A',
    secondaryLight: '#2A1A12',
    success: '#00D9A0',
    successLight: '#0D2B22',
    warning: '#FFCA28',
    warningLight: '#2B2200',
    error: '#FF6B6B',
    errorLight: '#2B1010',
    background: '#0A0A0F',
    surface: '#141420',
    surfaceHover: '#1C1C2E',
    border: '#2A2A3E',
    borderFocus: '#8B6FFF',
    textPrimary: '#F0F0F5',
    textSecondary: '#9090A8',
    textTertiary: '#5A5A72',
    textInverse: '#0D0D0D',
  },
};

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
  },
};

export const spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
  6: 24, 7: 28, 8: 32, 9: 36, 10: 40,
  12: 48, 14: 56, 16: 64, 20: 80,
};

export const radius = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 9999,
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#6C47FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  lg: { shadowColor: '#6C47FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
};

export type Colors = typeof palette.light;
export type Theme = {
  colors: Colors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
};

type ThemeContextType = Theme & {
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val) setThemePreferenceState(val as any);
    });
  }, []);

  const setThemePreference = (pref: 'light' | 'dark' | 'system') => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem(THEME_KEY, pref);
  };

  const isDark = themePreference === 'system' ? systemColorScheme === 'dark' : themePreference === 'dark';
  const colors = isDark ? palette.dark : palette.light;

  const theme: ThemeContextType = {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    isDark,
    themePreference,
    setThemePreference,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
