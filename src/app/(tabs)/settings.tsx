import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getAutoSmsOnAttendance,
  getInstitutionName,
  getSmsConfig,
  saveAutoSmsOnAttendance,
  saveInstitutionName,
  saveSmsConfig,
} from '@/services/settings';
import { sendSms } from '@/services/sms';
import { useThemeMode } from '@/hooks/theme-mode-context';
import { Button } from '@/components/ui/button';
import { ChipRow } from '@/components/ui/chip';
import { ListRow } from '@/components/ui/list-row';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PalettePref, ThemeModePref } from '@/services/settings';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, palette, setPalette } = useThemeMode();

  const [institutionName, setInstitutionName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [autoSms, setAutoSms] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getInstitutionName().then(setInstitutionName);
    getSmsConfig().then((c) => { setBaseUrl(c.baseUrl); setToken(c.token); });
    getAutoSmsOnAttendance().then(setAutoSms);
  }, []);

  const handleTestSms = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      await sendSms({ baseUrl, token }, [testNumber], 'Test message from Attendance Manager.');
      setTestStatus('Sent successfully.');
    } catch (e) {
      setTestStatus(e instanceof Error ? e.message : 'Failed to send test SMS.');
    }
    setTesting(false);
  };

  return (
    <ThemedView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <ThemedText type="title">Settings</ThemedText>
        </View>

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>APPEARANCE</ThemedText>
        <ChipRow
          options={[{ value: 'system' as ThemeModePref, label: 'System' }, { value: 'light' as ThemeModePref, label: 'Light' }, { value: 'dark' as ThemeModePref, label: 'Dark' }]}
          selected={mode}
          onSelect={setMode}
        />

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>COLOR PALETTE</ThemedText>
        <ChipRow
          options={[
            { value: 'blue-teal' as PalettePref, label: 'Blue + Teal' },
            { value: 'deep-blue' as PalettePref, label: 'Deep Blue + White' },
          ]}
          selected={palette}
          onSelect={setPalette}
        />

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>INSTITUTION</ThemedText>
        <View style={styles.card}>
          <TextField label="Institution name" value={institutionName} onChangeText={setInstitutionName} placeholder="e.g. Sunrise Public School" />
          <Button label="Save" variant="tonal" onPress={() => saveInstitutionName(institutionName.trim())} />
        </View>

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>SMS GATEWAY</ThemedText>
        <View style={styles.card}>
          <TextField label="Gateway base URL" value={baseUrl} onChangeText={setBaseUrl} placeholder="http://192.168.1.10:8080" autoCapitalize="none" />
          <TextField label="Access token" value={token} onChangeText={setToken} placeholder="Bearer token" autoCapitalize="none" />
          <Button label="Save gateway settings" variant="tonal" onPress={() => saveSmsConfig(baseUrl.trim(), token.trim())} />

          <View style={styles.switchRow}>
            <ThemedText type="bodyBold" style={styles.switchLabel}>Send SMS automatically on attendance</ThemedText>
            <Switch value={autoSms} onValueChange={(v) => { setAutoSms(v); saveAutoSmsOnAttendance(v); }} />
          </View>

          <TextField label="Test number" value={testNumber} onChangeText={setTestNumber} placeholder="10-digit mobile" keyboardType="phone-pad" />
          <Button label={testing ? 'Sending\u2026' : 'Send test SMS'} variant="outlined" onPress={handleTestSms} loading={testing} />
          {testStatus ? <ThemedText type="small" themeColor="textSecondary" style={styles.testStatus}>{testStatus}</ThemedText> : null}
        </View>

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>DEVICE &amp; DATA</ThemedText>
        <ListRow title="Fingerprint scanner" subtitle="Connect, initialize, and check sensor info" onPress={() => router.push('/device')} />
        <ListRow title="Manage fingerprints" subtitle="View or remove all enrolled templates" onPress={() => router.push('/fingerprints')} />
        <ListRow title="SMS log" subtitle="History of sent and failed messages" onPress={() => router.push('/sms-log')} />

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>ABOUT</ThemedText>
        <ListRow title="App version" subtitle="1.0.0" />
        <ListRow title="Fingerprint hardware" subtitle="AS608 sensor via CH340 USB-UART" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { paddingBottom: 96 },
  header: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
  sectionLabel: { marginHorizontal: Spacing.four, marginTop: Spacing.four, marginBottom: Spacing.two },
  card: { paddingHorizontal: Spacing.four, gap: Spacing.one },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  switchLabel: { flex: 1, marginRight: Spacing.two },
  testStatus: { marginTop: Spacing.one },
});
