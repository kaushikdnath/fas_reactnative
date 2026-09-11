import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'filled',
  loading = false,
  disabled = false,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    filled: theme.primary,
    tonal: theme.primaryContainer,
    outlined: 'transparent',
    text: 'transparent',
    danger: theme.error,
  };
  const fg: Record<Variant, string> = {
    filled: theme.onPrimary,
    tonal: theme.onPrimaryContainer,
    outlined: theme.primary,
    text: theme.primary,
    danger: theme.onError,
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant], opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        variant === 'outlined' && { borderWidth: 1.5, borderColor: theme.outline },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <ThemedText type="bodyBold" style={{ color: fg[variant] }}>
            {label}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
