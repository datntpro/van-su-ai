import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import {
  isAdMobConfigured,
  shouldShowAds,
  type AdPlacement,
} from '@/src/services/admob';
import { useEffectivePro } from '@/src/context/AppContext';

export function AdPlaceholder({
  label = 'Quảng cáo',
  placement = 'banner_home',
}: {
  label?: string;
  placement?: AdPlacement;
}) {
  const { effectivePro } = useEffectivePro();
  if (!shouldShowAds(effectivePro)) return null;

  const configured = isAdMobConfigured();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.sub}>
        {configured
          ? `AdMob placeholder · ${placement} (SDK chưa gắn live)`
          : 'AdMob chưa cấu hình · Free / hết trial'}
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
  sub: { color: colors.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
});
