import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { completeAuthSessionFromUrl } from '@/src/lib/authDeepLink';
import { colors } from '@/src/theme/colors';

/**
 * Deep-link landing for `vansuai://auth/callback` (email confirm).
 * Session is completed via URL tokens/code; AuthGate then routes by auth state.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await Linking.getInitialURL();
      if (url) await completeAuthSessionFromUrl(url);
      if (!cancelled) {
        // Prefer tabs; AuthGate will bounce to login if still unsigned-in.
        router.replace('/(tabs)');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
