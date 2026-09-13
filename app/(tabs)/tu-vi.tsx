import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { AdPlaceholder } from '@/src/components/AdPlaceholder';
import { Card } from '@/src/components/Card';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { MockAiBadge } from '@/src/components/MockAiBadge';
import { PaywallSheet } from '@/src/components/PaywallSheet';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import { generateDailyHoroscope } from '@/src/lib/horoscope';
import { canUseHoroscope, consumeHoroscope, FREE_LIMITS } from '@/src/lib/limits';
import { colors } from '@/src/theme/colors';

export default function TuViScreen() {
  const { profile } = useApp();
  const { effectivePro } = useEffectivePro();
  const router = useRouter();
  const [text, setText] = useState('');
  const [showMock, setShowMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paywall, setPaywall] = useState(false);

  const refreshLimit = useCallback(async () => {
    const r = await canUseHoroscope(effectivePro);
    setRemaining(r.remaining);
  }, [effectivePro]);

  useFocusEffect(
    useCallback(() => {
      refreshLimit();
    }, [refreshLimit]),
  );

  const onGenerate = async () => {
    if (!profile) return;
    const gate = await canUseHoroscope(effectivePro);
    if (!gate.ok) {
      setPaywall(true);
      return;
    }
    setLoading(true);
    try {
      const result = await generateDailyHoroscope(profile);
      await consumeHoroscope(effectivePro);
      setText(result.text);
      setShowMock(result.showMockBadge);
      await refreshLimit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tử vi hôm nay</Text>
      <Text style={styles.sub}>
        {effectivePro
          ? 'Pro / Trial · Không giới hạn'
          : `Free · Còn ${remaining ?? '…'}/${FREE_LIMITS.horoscopePerDay} lượt hôm nay`}
      </Text>

      <PrimaryButton
        title={text ? 'Xem lại / tạo mới' : 'Nhận tử vi ngày'}
        onPress={onGenerate}
        loading={loading}
        variant="gold"
      />

      {text ? (
        <Card style={{ marginTop: 16 }}>
          <MockAiBadge show={showMock} />
          <Text style={styles.body}>{text}</Text>
        </Card>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.placeholder}>
            Nhấn nút trên để nhận luận giải tiếng Việt dựa trên hồ sơ ngày sinh của bạn.
          </Text>
        </Card>
      )}

      {!effectivePro ? (
        <>
          <View style={{ height: 12 }} />
          <AdPlaceholder placement="banner_home" />
        </>
      ) : null}
      <View style={{ height: 12 }} />
      <DisclaimerBanner />
      <View style={{ height: 32 }} />

      <PaywallSheet
        visible={paywall}
        feature="horoscope"
        remaining={remaining ?? 0}
        onClose={() => setPaywall(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textMuted, marginBottom: 16, marginTop: 4 },
  body: { color: colors.text, lineHeight: 24, fontSize: 15 },
  placeholder: { color: colors.textMuted, lineHeight: 22 },
});
