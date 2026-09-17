/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Palettes } from '@/constants/theme';
import { useThemeMode } from '@/hooks/theme-mode-context';

/** Resolves the *effective* theme: takes both the user's color scheme
 *  (light/dark/system) and active palette ('blue-teal' | 'deep-blue') into account. */
export function useTheme() {
  const { resolvedScheme, palette } = useThemeMode();
  const currentPalette = Palettes[palette] ?? Palettes['blue-teal'];
  return currentPalette[resolvedScheme];
}
