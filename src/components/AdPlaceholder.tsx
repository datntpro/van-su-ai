import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import { isAdMobConfigured } from '@/src/services/admob';

export function AdPlaceholder({ label = 'Quảng cáo' }: { label?: string }) {
  const configured = isAdMobConfigured();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.sub}>
        {configured
          ? 'AdMob banner placeholder (SDK chưa gắn)'
          : 'AdMob chưa cấu hình · Free tier'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  title: { color: colors.goldSoft, fontSize: 12, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
