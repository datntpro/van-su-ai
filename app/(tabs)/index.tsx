import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdPlaceholder } from '@/src/components/AdPlaceholder';
import { Card } from '@/src/components/Card';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SoftTrialNudge, TrialBanner } from '@/src/components/TrialBanner';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import {
  formatLunar,
  formatSolar,
  getDayFortune,
} from '@/src/lib/calendar';
import { formatTrialCountdown } from '@/src/lib/entitlement';
import { zodiacFromBirthDate, yearAnimal } from '@/src/lib/profile';
import { colors } from '@/src/theme/colors';

export default function HomNayScreen() {
  const { profile, entitlement } = useApp();
  const { effectivePro, isProPaid } = useEffectivePro();
  const router = useRouter();
  const fortune = getDayFortune(new Date());
  const qualityColor =
    fortune.dayQuality === 'tot'
      ? colors.success
      : fortune.dayQuality === 'xau'
        ? colors.danger
        : colors.warning;

  const statusLabel = isProPaid
    ? 'Pro ✨'
    : entitlement.trialActive
      ? `Trial · ${formatTrialCountdown(entitlement)}`
      : 'Free';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TrialBanner onPressPro={() => router.push('/pro')} />
      <SoftTrialNudge onUpgrade={() => router.push('/pro')} />

      <Text style={styles.hello}>
        Xin chào{profile?.displayName ? `, ${profile.displayName}` : ''} 👋
      </Text>
      <Text style={styles.brand}>Lịch vạn sự hôm nay</Text>

      <Card style={styles.hero}>
        <Text style={styles.solar}>{formatSolar(fortune.solar)}</Text>
        <Text style={styles.lunar}>{formatLunar(fortune.lunar)}</Text>
        <View style={[styles.badge, { borderColor: qualityColor }]}>
          <Text style={[styles.badgeText, { color: qualityColor }]}>
            {fortune.dayQualityLabel}
          </Text>
        </View>
        <Text style={styles.canChi}>
          Ngày {fortune.canChiDay} · Tháng {fortune.canChiMonth} · Năm {fortune.canChiYear}
        </Text>
        <Text style={styles.summary}>{fortune.summary}</Text>
        {profile ? (
          <Text style={styles.profileHint}>
            Cung {zodiacFromBirthDate(profile.birthDate)} · Tuổi {yearAnimal(profile.birthDate)}
            {' · '}
            {statusLabel}
          </Text>
        ) : null}
      </Card>

      <Text style={styles.section}>Giờ hoàng đạo</Text>
      <Card>
        <View style={styles.hours}>
          {fortune.hoangDaoHours.map((h) => (
            <View
              key={h.name}
              style={[styles.hourChip, h.good ? styles.hourGood : styles.hourBad]}
            >
              <Text style={styles.hourName}>{h.name}</Text>
              <Text style={styles.hourRange}>{h.range}</Text>
              <Text style={styles.hourTag}>{h.good ? 'Hoàng đạo' : 'Hắc đạo'}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ height: 12 }} />
      <PrimaryButton title="💬 Hỏi Van Su AI" onPress={() => router.push('/chat')} />

      {!effectivePro ? (
        <>
          <View style={{ height: 12 }} />
          <AdPlaceholder label="Banner quảng cáo" placement="banner_home" />
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
  hello: { color: colors.textMuted, fontSize: 14 },
  brand: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 12, marginTop: 2 },
  hero: { borderColor: colors.purple, marginBottom: 16 },
  solar: { color: colors.gold, fontSize: 22, fontWeight: '800' },
  lunar: { color: colors.purpleSoft, marginTop: 4, fontSize: 15 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontWeight: '700', fontSize: 13 },
  canChi: { color: colors.textMuted, marginTop: 10, fontSize: 13 },
  summary: { color: colors.text, marginTop: 10, lineHeight: 22, fontSize: 15 },
  profileHint: { color: colors.goldSoft, marginTop: 12, fontSize: 12 },
  section: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourChip: {
    width: '30%',
    flexGrow: 1,
    minWidth: 96,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  hourGood: { backgroundColor: colors.chipGood, borderColor: colors.success },
  hourBad: { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
  hourName: { color: colors.text, fontWeight: '700' },
  hourRange: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  hourTag: { color: colors.goldSoft, fontSize: 10, marginTop: 4 },
});
