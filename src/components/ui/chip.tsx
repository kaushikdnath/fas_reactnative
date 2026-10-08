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
  subLabel,
  selected = false,
  onPress,
  styleCss = {},
}: {
  label: string;
  subLabel?: string;
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
      <View style={{ flexDirection: "column" }}>
        <ThemedText
          type="small"
          style={{
            color: selected ? theme.onPrimaryContainer : theme.textSecondary,
          }}
        >
          {label}
        </ThemedText>
        {subLabel && (
          <ThemedText
            type="smaller"
            style={{
              color: selected ? theme.onPrimaryContainer : theme.textSecondary,
            }}
          >
            {subLabel}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

export function ChipRow<T extends string | number>({
  options,
  selected,
  onSelect,
  styleCss = {},
  chipStyleCss = {},
  direction = "row",
}: {
  options: Array<{ value: T; label: string; subLabel?: string }>;
  selected: T;
  onSelect: (v: T) => void;
  styleCss?: StyleProp<ViewStyle>;
  chipStyleCss?: StyleProp<ViewStyle>;
  direction?: "row" | "col";
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ minWidth: "100%" }}
    >
      <View style={[styles[direction], styleCss]}>
        {options.map((o) => (
          <Chip
            key={String(o.value)}
            label={o.label}
            subLabel={o.subLabel}
            selected={o.value === selected}
            onPress={() => onSelect(o.value)}
            styleCss={chipStyleCss}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.two,
  },
  col: {
    paddingBottom: Spacing.two,
    flexDirection: "column",
    flexWrap: "wrap",
    maxHeight: 70,
    gap: 10,
  },
  row: {
    paddingBottom: Spacing.two,
    flexDirection: "row",
    flexWrap: "wrap",
    maxHeight: 60,
    gap: 10,
    width: "100%",
  },
});
