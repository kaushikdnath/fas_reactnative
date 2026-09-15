import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Chip({
  label,
  selected = false,
  onPress,
  styleCss = {},
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  styleCss?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? theme.primaryContainer
            : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.outlineVariant,
        },
        styleCss,
      ]}
    >
      <ThemedText
        type="small"
        style={{
          color: selected ? theme.onPrimaryContainer : theme.textSecondary,
        }}
      >
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {options.map((o) => (
          <Chip
            key={String(o.value)}
            label={o.label}
            selected={o.value === selected}
            onPress={() => onSelect(o.value)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginRight: Spacing.two,
    minWidth: 100,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  row: {
    // paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    flexDirection: "column",
    flexWrap: "wrap",
    maxHeight: 115,
    gap: 10,
  },
});
