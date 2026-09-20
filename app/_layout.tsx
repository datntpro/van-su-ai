import { DarkTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { AppProvider, useApp } from '@/src/context/AppContext';
import { OnboardingModal } from '@/src/components/OnboardingModal';
import { TrialExpiredModal } from '@/src/components/TrialExpiredModal';
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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready: authReady, user } = useAuth();
  const { ready: appReady } = useApp();
  const segments = useSegments();
  const router = useRouter();

  const ready = authReady && (user ? appReady : true);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!authReady) return;
    const inAuth = segments[0] === '(auth)';
    const inAuthCallback = segments[0] === 'auth'; // vansuai://auth/callback
    if (!user && !inAuth && !inAuthCallback) {
      router.replace('/(auth)/login');
    } else if (user && (inAuth || inAuthCallback)) {
      router.replace('/(tabs)');
    }
  }, [authReady, user, segments, router]);

  if (!ready) return null;
  return <>{children}</>;
}

function RootNav() {
  const { profile } = useApp();
  const { user } = useAuth();

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chon-ngay-tot"
          options={{
            title: 'Chọn ngày tốt',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.gold,
          }}
        />
        <Stack.Screen
          name="la-so"
          options={{
            title: 'Lá số tử vi',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.gold,
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            presentation: 'modal',
            title: 'Chat AI',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.gold,
          }}
        />
        <Stack.Screen
          name="legal/privacy"
          options={{
            title: 'Quyền riêng tư',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.gold,
          }}
        />
        <Stack.Screen
          name="legal/terms"
          options={{
            title: 'Điều khoản',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.gold,
          }}
        />
      </Stack>
      {user ? <OnboardingModal visible={!profile} /> : null}
      <TrialExpiredModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider value={navTheme}>
          <AuthGate>
            <RootNav />
          </AuthGate>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
