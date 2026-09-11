import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function StatCard({ label, value, tone = 'neutral', onPress }: { label: string; value: string; tone?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'; onPress?: () => void }) {
  const theme = useTheme();
  const valueColor = tone === 'primary' ? theme.primary : tone === 'success' ? theme.success : tone === 'warning' ? theme.warning : tone === 'error' ? theme.error : theme.text;

  return (
    <Pressable onPress={onPress} style={styles.pressable} disabled={!onPress}>
      <ThemedView type="surface" style={styles.card}>
        <ThemedText type="headline" style={{ color: valueColor }} numberOfLines={1}>
          {value}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flexGrow: 1, flexBasis: '47%' },
  card: { borderRadius: Radius.large, padding: Spacing.three, gap: 4 },
});
