import { StyleSheet, Text, View } from 'react-native';

import { colors, DISCLAIMER } from '@/src/theme/colors';

export function DisclaimerBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>⚠ {DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
