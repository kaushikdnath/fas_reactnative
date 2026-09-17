/**
 * Design tokens for the app.
 *
 * Provides two hand-tuned palettes:
 * 1. 'blue-teal': Deep Ocean Blue + Vibrant Teal accent + Crisp White
 * 2. 'deep-blue': Classic Deep Navy Blue + Pure White
 *
 * Each palette supports both 'light' and 'dark' color schemes.
 * Every screen and UI component composes these tokens directly via
 * useTheme() / ThemedView / ThemedText.
 */
import '@/global.css';

import { Platform } from 'react-native';

export const Palettes = {
  'blue-teal': {
    light: {
      text: '#0C1829',
      textSecondary: '#475B6E',
      background: '#F4F7FB',
      backgroundElement: '#E7EEF5',
      backgroundSelected: '#D1E1EF',
      surface: '#FFFFFF',
      surfaceVariant: '#DEE7F0',
      outline: '#62768A',
      outlineVariant: '#C8D5E3',

      primary: '#0A4D8C',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D8E9F8',
      onPrimaryContainer: '#001D38',

      secondary: '#007D8A',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#CCF0F2',
      onSecondaryContainer: '#002024',

      teal: '#00838F',
      onTeal: '#FFFFFF',
      tealContainer: '#CCF0F2',
      onTealContainer: '#002024',

      accent: '#00A3A6',
      onAccent: '#FFFFFF',

      tabBarIcon: '#8A9CAE',
      tabBarIconSelected: '#00838F',
      tabBarIndicator: '#CCF0F2',

      success: '#0F8265',
      successContainer: '#D0F2E7',
      warning: '#D97706',
      warningContainer: '#FEF3C7',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      errorContainer: '#FFDAD6',
      onErrorContainer: '#410002',

      neutral: '#66788A',
      scannerOffline: '#8F9FA8',
    },
    dark: {
      text: '#F0F5FA',
      textSecondary: '#8E9EB2',
      background: '#070E18',
      backgroundElement: '#152234',
      backgroundSelected: '#1F324C',
      surface: '#0F1A2A',
      surfaceVariant: '#1A283C',
      outline: '#6D859E',
      outlineVariant: '#26374D',

      primary: '#68B0FA',
      onPrimary: '#002E5C',
      primaryContainer: '#0C3E6E',
      onPrimaryContainer: '#D8E9F8',

      secondary: '#38D4DE',
      onSecondary: '#00363B',
      secondaryContainer: '#005058',
      onSecondaryContainer: '#CCF0F2',

      teal: '#38D4DE',
      onTeal: '#00363B',
      tealContainer: '#005058',
      onTealContainer: '#CCF0F2',

      accent: '#26C6DA',
      onAccent: '#00373C',

      tabBarIcon: '#6A8098',
      tabBarIconSelected: '#38D4DE',
      tabBarIndicator: '#0A3B56',

      success: '#34D399',
      successContainer: '#064E3B',
      warning: '#FBBF24',
      warningContainer: '#5A3200',
      error: '#FFB4AB',
      onError: '#690005',
      errorContainer: '#93000A',
      onErrorContainer: '#FFDAD6',

      neutral: '#7F93A7',
      scannerOffline: '#596A7C',
    },
  },
  'deep-blue': {
    light: {
      text: '#081426',
      textSecondary: '#475569',
      background: '#FFFFFF',
      backgroundElement: '#F0F4F8',
      backgroundSelected: '#D9E4F2',
      surface: '#FFFFFF',
      surfaceVariant: '#E1E8F0',
      outline: '#5E7085',
      outlineVariant: '#CBD5E1',

      primary: '#0B2F64',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D9E4F5',
      onPrimaryContainer: '#001938',

      secondary: '#36547A',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#D5E2F2',
      onSecondaryContainer: '#0D1E33',

      teal: '#008080',
      onTeal: '#FFFFFF',
      tealContainer: '#CCEBEB',
      onTealContainer: '#002020',

      accent: '#1E5EB8',
      onAccent: '#FFFFFF',

      tabBarIcon: '#8A9CAE',
      tabBarIconSelected: '#1A6FD6',
      tabBarIndicator: '#DCEAF8',

      success: '#15803D',
      successContainer: '#DCFCE7',
      warning: '#D97706',
      warningContainer: '#FEF3C7',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      errorContainer: '#FFDAD6',
      onErrorContainer: '#410002',

      neutral: '#64748B',
      scannerOffline: '#94A3B8',
    },
    dark: {
      text: '#FFFFFF',
      textSecondary: '#8E9EB2',
      background: '#060B14',
      backgroundElement: '#121E32',
      backgroundSelected: '#1C2E4A',
      surface: '#0D1626',
      surfaceVariant: '#18243A',
      outline: '#6D8099',
      outlineVariant: '#24334A',

      primary: '#7EAFF8',
      onPrimary: '#00295C',
      primaryContainer: '#0D3C7A',
      onPrimaryContainer: '#D9E4F5',

      secondary: '#A0C2E8',
      onSecondary: '#082847',
      secondaryContainer: '#243F63',
      onSecondaryContainer: '#D5E2F2',

      teal: '#4DD0E1',
      onTeal: '#00363D',
      tealContainer: '#004F58',
      onTealContainer: '#CCEBEB',

      accent: '#5C9BF5',
      onAccent: '#002554',

      tabBarIcon: '#6A8098',
      tabBarIconSelected: '#7EAFF8',
      tabBarIndicator: '#12335C',

      success: '#4ADE80',
      successContainer: '#14532D',
      warning: '#FBBF24',
      warningContainer: '#5A3200',
      error: '#FFB4AB',
      onError: '#690005',
      errorContainer: '#93000A',
      onErrorContainer: '#FFDAD6',

      neutral: '#7D90A6',
      scannerOffline: '#546578',
    },
  },
} as const;

/** Backwards-compatible default colors object */
export const Colors = Palettes['blue-teal'];

export type PaletteName = keyof typeof Palettes;
export type PaletteColors = (typeof Palettes)['blue-teal']['light'];
export type ThemeColor = keyof PaletteColors;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
