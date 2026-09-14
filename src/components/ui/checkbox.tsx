import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CheckboxProps = {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback fired when checked state changes */
  onChange?: (checked: boolean) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Optional custom styling for the checkbox square */
  style?: StyleProp<ViewStyle>;
};

/**
 * Accessible Checkbox component styled with theme tokens.
 */
export function Checkbox({
  checked,
  onChange,
  disabled = false,
  style,
}: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      hitSlop={8}
      style={[
        styles.box,
        {
          borderColor: checked ? theme.primary : theme.outline,
          backgroundColor: checked ? theme.primary : "transparent",
        },
        disabled && styles.disabledBox,
        style,
      ]}
    >
      {checked ? (
        <ThemedText style={[styles.checkmark, { color: theme.onPrimary }]}>
          {"\u2713"}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: Radius.small / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  disabledBox: {
    opacity: 0.38,
  },
});
