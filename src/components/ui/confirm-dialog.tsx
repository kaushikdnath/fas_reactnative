import { Modal, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

/** Simple centered modal used for delete confirmations and cascade-option
 *  pickers -- the project has no bottom-sheet dependency, so this is a
 *  plain RN Modal styled to match the rest of the design system. */
export function ConfirmDialog({
  visible,
  title,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmVariant = 'filled',
  busy = false,
  children,
}: {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmVariant?: 'filled' | 'danger';
  busy?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView type="surface" style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          {children}
          <View style={styles.actions}>
            <Button label="Cancel" variant="text" onPress={onCancel} style={styles.actionBtn} />
            <Button label={confirmLabel} variant={confirmVariant} onPress={onConfirm} loading={busy} style={styles.actionBtn} />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.four },
  card: { borderRadius: Radius.xlarge, padding: Spacing.four },
  title: { marginBottom: Spacing.three },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.three },
  actionBtn: { minWidth: 100 },
});
