import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <ThemedView type="surface" style={[styles.row, pressed && styles.pressed]}>
          {leading}
          <View style={styles.textWrap}>
            <ThemedText type="bodyBold" numberOfLines={1}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {trailing}
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  pressed: { opacity: 0.75 },
  textWrap: { flex: 1 },
});
