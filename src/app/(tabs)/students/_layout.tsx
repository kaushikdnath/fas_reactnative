import { Stack } from 'expo-router';

export default function StudentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]/enroll" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
