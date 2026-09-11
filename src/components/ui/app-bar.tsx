import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Custom top bar used by every screen (the project doesn't use Stack's
 *  native header -- `headerShown: false` is set globally, see _layout.tsx
 *  files) so back/action buttons stay visually consistent everywhere. */
export function AppBar({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={[styles.bar, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <ThemedText style={{ fontSize: 22, color: theme.text }}>{'\u2190'}</ThemedText>
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <ThemedText type="headline" numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {action}
      </View>
    </ThemedView>
  );
}

/** Convenience: pops the router stack, used as the default `onBack`. */
export const goBack = () => router.back();

const styles = StyleSheet.create({
  bar: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 40 },
  backBtn: { padding: Spacing.one, marginLeft: -Spacing.one },
  titleWrap: { flex: 1 },
});
