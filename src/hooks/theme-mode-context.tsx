import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { getThemeMode, saveThemeMode, type ThemeModePref } from '@/services/settings';

type Ctx = { mode: ThemeModePref; setMode: (m: ThemeModePref) => void; resolvedScheme: 'light' | 'dark' };
const ThemeModeContext = createContext<Ctx | null>(null);

/** Wraps the app so a user-picked theme (Settings screen) overrides the
 *  system color scheme; persisted via AsyncStorage so it survives restarts. */
export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeModePref>('system');

  useEffect(() => { getThemeMode().then(setModeState); }, []);

  const setMode = (m: ThemeModePref) => { setModeState(m); saveThemeMode(m); };
  const resolvedScheme: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  return <ThemeModeContext.Provider value={{ mode, setMode, resolvedScheme }}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): Ctx {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
