import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  secureTextEntry,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <ThemedText type="label" themeColor="textSecondary" style={styles.label}>
        {label.toUpperCase()}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.outline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: error ? theme.error : 'transparent',
          },
          multiline && styles.multiline,
        ]}
      />
      {error ? (
        <ThemedText type="small" themeColor="error" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.three },
  label: { marginBottom: Spacing.one },
  input: {
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { marginTop: Spacing.one },
});
