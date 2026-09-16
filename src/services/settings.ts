import AsyncStorage from '@react-native-async-storage/async-storage';

export type SmsConfig = { baseUrl: string; token: string };
export type ThemeModePref = 'system' | 'light' | 'dark';
export type PalettePref = 'blue-teal' | 'deep-blue';

const KEYS = {
  smsBaseUrl: 'sms.baseUrl',
  smsToken: 'sms.token',
  themeMode: 'app.themeMode',
  themePalette: 'app.themePalette',
  institutionName: 'app.institutionName',
  autoSmsOnAttendance: 'app.autoSmsOnAttendance',
} as const;

export async function getSmsConfig(): Promise<SmsConfig> {
  return {
    baseUrl: (await AsyncStorage.getItem(KEYS.smsBaseUrl)) || 'http://127.0.0.1:8080',
    token: (await AsyncStorage.getItem(KEYS.smsToken)) || '',
  };
}

export async function saveSmsConfig(baseUrl: string, token: string): Promise<void> {
  await AsyncStorage.multiSet([[KEYS.smsBaseUrl, baseUrl], [KEYS.smsToken, token]]);
}

export async function getThemeMode(): Promise<ThemeModePref> {
  const v = await AsyncStorage.getItem(KEYS.themeMode);
  return v === 'light' || v === 'dark' ? v : 'system';
}

export async function saveThemeMode(mode: ThemeModePref): Promise<void> {
  await AsyncStorage.setItem(KEYS.themeMode, mode);
}

export async function getThemePalette(): Promise<PalettePref> {
  const v = await AsyncStorage.getItem(KEYS.themePalette);
  return v === 'deep-blue' ? 'deep-blue' : 'blue-teal';
}

export async function saveThemePalette(palette: PalettePref): Promise<void> {
  await AsyncStorage.setItem(KEYS.themePalette, palette);
}

export async function getInstitutionName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.institutionName)) || '';
}

export async function saveInstitutionName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.institutionName, name);
}

export async function getAutoSmsOnAttendance(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.autoSmsOnAttendance)) === '1';
}

export async function saveAutoSmsOnAttendance(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.autoSmsOnAttendance, enabled ? '1' : '0');
}
