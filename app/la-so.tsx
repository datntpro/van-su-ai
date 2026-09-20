import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { Card } from '@/src/components/Card';
import { MockAiBadge } from '@/src/components/MockAiBadge';
import { PaywallSheet } from '@/src/components/PaywallSheet';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import {
  buildLaSoPillars,
  canOpenLaSo,
  generateLaSo,
  hasRichLaSoContext,
} from '@/src/lib/laSo';
import { canUseHoroscope, consumeHoroscope, FREE_LIMITS } from '@/src/lib/limits';
import { colors } from '@/src/theme/colors';

export default function LaSoScreen() {
  const { profile, traits } = useApp();
  const { effectivePro } = useEffectivePro();
  const router = useRouter();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'api' | 'mock'>('mock');
  const [showMock, setShowMock] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [usedFree, setUsedFree] = useState(false);

  const pillars = profile ? buildLaSoPillars(profile) : null;
  const ready = canOpenLaSo(profile, traits);

  const refreshLimit = useCallback(async () => {
    const r = await canUseHoroscope(effectivePro);
    setRemaining(r.remaining);
  }, [effectivePro]);

  useFocusEffect(
    useCallback(() => {
      refreshLimit();
    }, [refreshLimit]),
  );

  const onView = async () => {
    if (!profile || !ready) return;
    const gate = await canUseHoroscope(effectivePro);
    if (!gate.ok) {
      setPaywall(true);
      return;
    }
    setLoading(true);
    try {
      await consumeHoroscope(effectivePro);
      await refreshLimit();
      const full = effectivePro;
      const res = await generateLaSo({ profile, traits, full });
      setText(res.text);
      setSource(res.source);
      setShowMock(res.showMockBadge);
      if (!effectivePro) setUsedFree(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Lá số tử vi',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.gold,
        }}
      />
      <Screen contentStyle={styles.content}>
        <Text style={styles.title}>Lá số của bạn</Text>
        <Text style={styles.sub}>
          Tóm tắt can chi lúc sinh · ngũ hành ước lượng · cục diện giải trí
          {effectivePro
            ? ' · Pro / Trial đầy đủ'
            : ` · Free: ${FREE_LIMITS.horoscopePerDay} lần/ngày (chung với tử vi)`}
        </Text>

        {!ready || !pillars ? (
          <Card>
            <Text style={styles.body}>
              Cần ngày sinh trong hồ sơ. Hoàn tất onboarding hoặc cập nhật ở tab Pro.
            </Text>
            <View style={{ height: 10 }} />
            <PrimaryButton title="Về Tử vi" variant="ghost" onPress={() => router.back()} />
          </Card>
        ) : (
          <>
            <Card style={styles.pillars}>
              <Text style={styles.pillarLine}>Âm lịch: {pillars.lunarLabel}</Text>
              <Text style={styles.pillarLine}>
                Năm {pillars.year} · Tháng {pillars.month}
              </Text>
              <Text style={styles.pillarLine}>
                Ngày {pillars.day}
                {pillars.hour ? ` · Giờ ${pillars.hour}` : ' · Giờ: chưa có'}
              </Text>
              <Text style={styles.pillarMeta}>
                Ngũ hành năm: {pillars.nguHanhYear} · Tuổi {pillars.yearAnimal} (năm
                sinh) · {pillars.westernZodiac}
              </Text>
              {!hasRichLaSoContext(profile!, traits) ? (
                <Text style={styles.hint}>
                  Thêm giờ sinh / vài thông tin ở tab Tử vi để lá số sát hơn.
                </Text>
              ) : null}
            </Card>

            {!text ? (
              <PrimaryButton
                title={effectivePro ? 'Xem lá số đầy đủ' : 'Xem lá số (tóm tắt Free)'}
                variant="gold"
                loading={loading}
                onPress={onView}
              />
            ) : (
              <>
                <Card>
                  <MockAiBadge show={showMock && source === 'mock'} />
                  <Text style={styles.body}>{text}</Text>
                </Card>
                <View style={{ height: 10 }} />
                {effectivePro ? (
                  <PrimaryButton
                    title="Xem lại / làm mới"
                    variant="ghost"
                    loading={loading}
                    onPress={onView}
                  />
                ) : usedFree ? (
                  <PrimaryButton
                    title="Nâng Pro để xem đầy đủ"
                    variant="gold"
                    onPress={() => router.push('/pro')}
                  />
                ) : null}
              </>
            )}

            {remaining != null && !effectivePro ? (
              <Text style={styles.limit}>
                Còn {remaining}/{FREE_LIMITS.horoscopePerDay} lượt luận hôm nay
              </Text>
            ) : null}
          </>
        )}

        <View style={{ height: 12 }} />
        <PrimaryButton
          title="Điều khoản sử dụng"
          variant="ghost"
          onPress={() => router.push('/legal/terms')}
        />
        <View style={{ height: 32 }} />

        <PaywallSheet
          visible={paywall}
          feature="horoscope"
          remaining={remaining ?? 0}
          onClose={() => setPaywall(false)}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 14, lineHeight: 18 },
  pillars: { borderColor: colors.purple, marginBottom: 14 },
  pillarLine: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  pillarMeta: { color: colors.goldSoft, fontSize: 12, marginTop: 8, lineHeight: 18 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  body: { color: colors.text, lineHeight: 22, fontSize: 14 },
  limit: { color: colors.textMuted, fontSize: 12, marginTop: 10, textAlign: 'center' },
});
