import AsyncStorage from "@react-native-async-storage/async-storage";

export type SmsConfig = { selectedSIM: string };
export type ThemeModePref = "system" | "light" | "dark";
export type PalettePref = "blue-teal" | "deep-blue";

const KEYS = {
  selectedSIM: "sms.selectedSIM",
  themeMode: "app.themeMode",
  themePalette: "app.themePalette",
  institutionName: "app.institutionName",
  autoSmsOnAttendance: "app.autoSmsOnAttendance",
} as const;

export async function getSmsConfig(): Promise<SmsConfig> {
  return {
    selectedSIM: (await AsyncStorage.getItem(KEYS.selectedSIM)) || "1",
  };
}

export async function saveSmsConfig(selectedSIM: string): Promise<void> {
  await AsyncStorage.multiSet([[KEYS.selectedSIM, selectedSIM]]);
}

export async function getThemeMode(): Promise<ThemeModePref> {
  const v = await AsyncStorage.getItem(KEYS.themeMode);
  return v === "light" || v === "dark" ? v : "system";
}

export async function saveThemeMode(mode: ThemeModePref): Promise<void> {
  await AsyncStorage.setItem(KEYS.themeMode, mode);
}

export async function getThemePalette(): Promise<PalettePref> {
  const v = await AsyncStorage.getItem(KEYS.themePalette);
  return v === "deep-blue" ? "deep-blue" : "blue-teal";
}

export async function saveThemePalette(palette: PalettePref): Promise<void> {
  await AsyncStorage.setItem(KEYS.themePalette, palette);
}

export async function getInstitutionName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.institutionName)) || "";
}

export async function saveInstitutionName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.institutionName, name);
}

export async function getAutoSmsOnAttendance(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.autoSmsOnAttendance)) === "1";
}

export async function saveAutoSmsOnAttendance(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.autoSmsOnAttendance, enabled ? "1" : "0");
}
