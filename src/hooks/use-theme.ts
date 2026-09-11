/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/theme-mode-context';

/** Resolves the *effective* theme: the user's Settings-screen choice
 *  (light/dark/system) takes precedence over the raw OS scheme. */
export function useTheme() {
  const { resolvedScheme } = useThemeMode();
  return Colors[resolvedScheme];
}
