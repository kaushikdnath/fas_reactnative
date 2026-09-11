import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primaryContainer : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.outlineVariant,
        },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onPrimaryContainer : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ChipRow<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ value: T; label: string }>;
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={o.value === selected} onPress={() => onSelect(o.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.two,
  },
  row: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
});
