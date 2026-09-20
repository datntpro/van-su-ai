import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/src/theme/colors';

/** Tiny legal link — disclaimer copy lives only in Terms / Privacy. */
export function TermsLink({ label = 'Điều khoản' }: { label?: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/legal/terms')}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

/** @deprecated Prefer TermsLink — kept so old imports fail loudly if missed */
export function DisclaimerBanner() {
  return <TermsLink />;
}

const styles = StyleSheet.create({
  text: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
