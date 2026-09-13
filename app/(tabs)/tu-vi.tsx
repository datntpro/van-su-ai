import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { AdPlaceholder } from '@/src/components/AdPlaceholder';
import { Card } from '@/src/components/Card';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useApp } from '@/src/context/AppContext';
import { generateDailyHoroscope } from '@/src/lib/horoscope';
import { canUseHoroscope, consumeHoroscope, FREE_LIMITS } from '@/src/lib/limits';
import { colors } from '@/src/theme/colors';

export default function TuViScreen() {
  const { profile, isPro } = useApp();
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const refreshLimit = useCallback(async () => {
    const r = await canUseHoroscope(isPro);
    setRemaining(r.remaining);
  }, [isPro]);

  useFocusEffect(
    useCallback(() => {
      refreshLimit();
    }, [refreshLimit]),
  );

  const onGenerate = async () => {
    if (!profile) return;
    const gate = await canUseHoroscope(isPro);
    if (!gate.ok) {
      Alert.alert(
        'Đã hết lượt Free',
        `Free: ${FREE_LIMITS.horoscopePerDay} lần/ngày. Nâng Pro để xem không giới hạn.`,
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Xem Pro', onPress: () => router.push('/pro') },
        ],
      );
      return;
    }
    setLoading(true);
    try {
      const result = await generateDailyHoroscope(profile);
      await consumeHoroscope(isPro);
      setText(result);
      await refreshLimit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tử vi hôm nay</Text>
      <Text style={styles.sub}>
        {isPro
          ? 'Pro · Không giới hạn'
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
          <Text style={styles.body}>{text}</Text>
        </Card>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.placeholder}>
            Nhấn nút trên để nhận luận giải tiếng Việt dựa trên hồ sơ ngày sinh của bạn.
          </Text>
        </Card>
      )}

      {!isPro ? (
        <>
          <View style={{ height: 12 }} />
          <AdPlaceholder />
        </>
      ) : null}
      <View style={{ height: 12 }} />
      <DisclaimerBanner />
      <View style={{ height: 32 }} />
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
