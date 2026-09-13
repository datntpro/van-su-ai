import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';

/** Visible only when __DEV__ and response came from mock. */
export function MockAiBadge({ show }: { show?: boolean }) {
  if (!show) return null;
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>MOCK AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  text: { color: '#1A1200', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
