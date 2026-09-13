import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProvider, useApp } from '@/src/context/AppContext';
import { OnboardingModal } from '@/src/components/OnboardingModal';
import { colors } from '@/src/theme/colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.purple,
    text: colors.text,
    border: colors.border,
    notification: colors.gold,
  },
};

function RootNav() {
  const { ready, profile } = useApp();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat"
          options={{
            presentation: 'modal',
            title: 'Chat AI',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.gold,
          }}
        />
      </Stack>
      <OnboardingModal visible={!profile} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider value={navTheme}>
        <RootNav />
      </ThemeProvider>
    </AppProvider>
  );
}
