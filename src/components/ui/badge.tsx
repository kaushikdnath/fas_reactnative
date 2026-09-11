import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'success' | 'warning' | 'error' | 'neutral' }) {
  const theme = useTheme();
  const bgKey: ThemeColor = tone === 'success' ? 'successContainer' : tone === 'warning' ? 'warningContainer' : tone === 'error' ? 'errorContainer' : 'backgroundSelected';
  const fgKey: ThemeColor = tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'error' ? 'error' : 'textSecondary';

  return (
    <View style={[styles.badge, { backgroundColor: theme[bgKey] }]}>
      <ThemedText type="label" style={{ color: theme[fgKey] }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 4, borderRadius: Radius.small, alignSelf: 'flex-start' },
});
