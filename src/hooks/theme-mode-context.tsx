import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import {
  getThemeMode,
  getThemePalette,
  saveThemeMode,
  saveThemePalette,
  type PalettePref,
  type ThemeModePref,
} from '@/services/settings';

type Ctx = {
  mode: ThemeModePref;
  setMode: (m: ThemeModePref) => void;
  palette: PalettePref;
  setPalette: (p: PalettePref) => void;
  resolvedScheme: 'light' | 'dark';
};
const ThemeModeContext = createContext<Ctx | null>(null);

/** Wraps the app so a user-picked theme mode and palette (Settings screen) override the
 *  system color scheme; persisted via AsyncStorage so it survives restarts. */
export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeModePref>('system');
  const [palette, setPaletteState] = useState<PalettePref>('blue-teal');

  useEffect(() => {
    getThemeMode().then(setModeState);
    getThemePalette().then(setPaletteState);
  }, []);

  const setMode = (m: ThemeModePref) => {
    setModeState(m);
    saveThemeMode(m);
  };

  const setPalette = (p: PalettePref) => {
    setPaletteState(p);
    saveThemePalette(p);
  };

  const resolvedScheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, palette, setPalette, resolvedScheme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): Ctx {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
