/**
 * Design tokens for the app. Colors are hand-tuned to sit close to what
 * Material Theme Builder would generate from the brand seed (#2E5AAC),
 * since the project doesn't depend on a UI kit -- every screen composes
 * these tokens directly via useTheme() / ThemedView / ThemedText.
 */
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1B1F',
    textSecondary: '#44474E',
    background: '#FDFBFF',
    backgroundElement: '#F0F1F6',
    backgroundSelected: '#E1E2EC',
    surface: '#FFFFFF',
    surfaceVariant: '#E1E2EC',
    outline: '#75777F',
    outlineVariant: '#C4C6D0',

    primary: '#2E5AAC',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D8E2FF',
    onPrimaryContainer: '#001A41',

    secondary: '#585E71',
    secondaryContainer: '#DCE2F9',
    onSecondaryContainer: '#151B2C',

    success: '#2E7D32',
    successContainer: '#D6F0D8',
    warning: '#EF6C00',
    warningContainer: '#FFE4CC',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',

    neutral: '#79747E',
    scannerOffline: '#9E9E9E',
  },
  dark: {
    text: '#E3E2E6',
    textSecondary: '#C4C6D0',
    background: '#111318',
    backgroundElement: '#1D2024',
    backgroundSelected: '#2E3135',
    surface: '#1A1C20',
    surfaceVariant: '#44474E',
    outline: '#8E9099',
    outlineVariant: '#44474E',

    primary: '#AEC6FF',
    onPrimary: '#002E69',
    primaryContainer: '#154394',
    onPrimaryContainer: '#D8E2FF',

    secondary: '#C0C6DC',
    secondaryContainer: '#404659',
    onSecondaryContainer: '#DCE2F9',

    success: '#8BD68F',
    successContainer: '#1B4020',
    warning: '#FFB77C',
    warningContainer: '#5A3200',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',

    neutral: '#948F99',
    scannerOffline: '#6E7075',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
