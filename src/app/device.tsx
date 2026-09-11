import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AS608_EVENTS, FingerprintScanner } from '@/services/fingerprint-scanner';
import { logAudit } from '@/data/audit-repository';
import { AppBar, goBack } from '@/components/ui/app-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyStateView } from '@/components/ui/state-views';
import { ListRow } from '@/components/ui/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DeviceInfo } from '@/types/models';

export default function Device() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [freeSlots, setFreeSlots] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [clearVisible, setClearVisible] = useState(false);

  const refreshStatus = useCallback(async () => {
    const isConnected = await FingerprintScanner.isConnected().catch(() => false);
    setConnected(isConnected);
    if (isConnected) {
      const [count, free] = await Promise.all([
        FingerprintScanner.getTemplateCount().catch(() => null),
        FingerprintScanner.getFreeSlots().catch(() => null),
      ]);
      setTemplateCount(count);
      setFreeSlots(free ? free.length : null);
    }
  }, []);

  useEffect(() => {
    FingerprintScanner.listDevices().then(setDevices).catch(() => setDevices([]));
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!FingerprintScanner.events) return;
    const sub = FingerprintScanner.events.addListener(AS608_EVENTS.status, (e: { message: string }) => {
      setLog((prev) => [e.message, ...prev].slice(0, 20));
    });
    return () => sub.remove();
  }, []);

  const handleConnect = async (device: DeviceInfo) => {
    setBusy(true);
    try {
      await FingerprintScanner.connect(device.deviceId);
      await FingerprintScanner.initialize();
      await logAudit('scanner.connect', { deviceId: device.deviceId });
      await refreshStatus();
    } catch (e) {
      setLog((prev) => [e instanceof Error ? e.message : 'Connection failed', ...prev]);
    }
    setBusy(false);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    await FingerprintScanner.disconnect().catch(() => undefined);
    await logAudit('scanner.disconnect');
    await refreshStatus();
    setBusy(false);
  };

  const handleClearDatabase = async () => {
    setBusy(true);
    try {
      await FingerprintScanner.clearDatabase();
      await logAudit('scanner.clear_database');
      await refreshStatus();
    } catch (e) {
      setLog((prev) => [e instanceof Error ? e.message : 'Clear failed', ...prev]);
    }
    setBusy(false);
    setClearVisible(false);
  };

  return (
    <ThemedView style={styles.page}>
      <AppBar title="Fingerprint scanner" subtitle="AS608 via CH340 USB-UART" onBack={() => (router.canGoBack() ? goBack() : router.replace('/'))} />

      <View style={styles.statusRow}>
        <Badge label={connected ? 'Connected' : 'Not connected'} tone={connected ? 'success' : 'neutral'} />
        {connected ? <Badge label={`${templateCount ?? '\u2014'} templates`} tone="neutral" /> : null}
        {connected ? <Badge label={`${freeSlots ?? '\u2014'} free slots`} tone="neutral" /> : null}
      </View>

      {connected ? (
        <View style={styles.actionsRow}>
          <Button label="Disconnect" variant="outlined" onPress={handleDisconnect} disabled={busy} style={styles.actionBtn} />
          <Button label="Clear sensor database" variant="danger" onPress={() => setClearVisible(true)} disabled={busy} style={styles.actionBtn} />
        </View>
      ) : (
        <>
          <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>AVAILABLE USB DEVICES</ThemedText>
          {devices.length === 0 ? (
            <EmptyStateView icon="\uD83D\uDD0C" title="No USB device found" subtitle="Plug in the CH340/AS608 adapter, then pull down to refresh." />
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(d) => String(d.deviceId)}
              renderItem={({ item }) => (
                <ListRow
                  title={item.productName || item.deviceName || `Device ${item.deviceId}`}
                  subtitle={`VID ${item.vendorId ?? '?'} \u00B7 PID ${item.productId ?? '?'}`}
                  trailing={<Button label="Connect" variant="tonal" onPress={() => handleConnect(item)} />}
                />
              )}
            />
          )}
        </>
      )}

      <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>ACTIVITY LOG</ThemedText>
      <FlatList
        data={log}
        keyExtractor={(_, i) => String(i)}
        style={styles.logList}
        renderItem={({ item }) => (
          <ThemedText type="small" themeColor="textSecondary" style={styles.logLine}>{item}</ThemedText>
        )}
      />

      <ConfirmDialog
        visible={clearVisible}
        title="Clear sensor database?"
        confirmLabel="Clear"
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setClearVisible(false)}
        onConfirm={handleClearDatabase}>
        <ThemedText type="body">
          This erases every fingerprint template stored on the physical sensor. Templates saved on this phone are
          not affected and can be re-uploaded to the sensor afterward.
        </ThemedText>
      </ConfirmDialog>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  statusRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three, flexWrap: 'wrap' },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  actionBtn: { flex: 1 },
  sectionLabel: { marginHorizontal: Spacing.four, marginBottom: Spacing.two },
  logList: { maxHeight: 160, marginBottom: Spacing.three },
  logLine: { marginHorizontal: Spacing.four, marginBottom: Spacing.one },
});
