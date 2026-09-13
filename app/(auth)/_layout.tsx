import { Stack } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.gold,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Đăng nhập', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Đăng ký', headerShown: false }} />
    </Stack>
  );
}
