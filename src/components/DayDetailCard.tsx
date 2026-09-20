import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/Card';
import {
  formatLunar,
  formatSolar,
} from '@/src/lib/calendar';
import type { PersonalizedDayFortune } from '@/src/lib/personalizedFortune';
import { colors } from '@/src/theme/colors';

type Props = {
  fortune: PersonalizedDayFortune;
  bodySize?: number;
};

export function DayDetailCard({ fortune, bodySize = 15 }: Props) {
  const qualityColor =
    fortune.dayQuality === 'tot'
      ? colors.success
      : fortune.dayQuality === 'xau'
        ? colors.danger
        : colors.warning;

  return (
    <Card style={styles.hero}>
      <Text style={styles.solar}>{formatSolar(fortune.solar)}</Text>
      <Text style={styles.lunar}>{formatLunar(fortune.lunar)}</Text>
      <View style={[styles.badge, { borderColor: qualityColor }]}>
        <Text style={[styles.badgeText, { color: qualityColor }]}>
          {fortune.dayQualityLabel}
        </Text>
      </View>
      <Text style={styles.canChi}>
        Ngày {fortune.canChiDay} · Tháng {fortune.canChiMonth} · Năm{' '}
        {fortune.canChiYear}
      </Text>
      {fortune.personalized ? (
        <Text style={styles.personal}>
          {fortune.chiRelationLabel}
          {fortune.ageYears != null ? ` · ${fortune.ageYears} tuổi` : ''}
          {fortune.westernZodiac ? ` · ${fortune.westernZodiac}` : ''}
        </Text>
      ) : (
        <Text style={styles.personalHint}>
          Thêm ngày sinh trong hồ sơ để luận ngày cá nhân hóa.
        </Text>
      )}
      <Text style={[styles.summary, { fontSize: bodySize }]}>{fortune.summary}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { borderColor: colors.purple, marginBottom: 12 },
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
  personal: { color: colors.goldSoft, marginTop: 8, fontSize: 12, fontWeight: '600' },
  personalHint: { color: colors.textMuted, marginTop: 8, fontSize: 12, fontStyle: 'italic' },
  summary: { color: colors.text, marginTop: 10, lineHeight: 22 },
});
