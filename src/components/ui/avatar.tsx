import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function Avatar({ name, uri, size = 48 }: { name: string; uri?: string | null; size?: number }) {
  const theme = useTheme();
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.primaryContainer },
      ]}>
      <ThemedText style={{ color: theme.onPrimaryContainer, fontWeight: '700', fontSize: size * 0.36 }}>
        {initials || '?'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
