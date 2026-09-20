import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/src/components/Card';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useApp } from '@/src/context/AppContext';
import { useWindowLayout } from '@/src/hooks/useWindowLayout';
import {
  EVENT_TYPES,
  formatCandidateDate,
  recommendGoodDays,
  type EventTypeId,
  type GoodDayCandidate,
} from '@/src/lib/goodDays';
import { colors, DISCLAIMER } from '@/src/theme/colors';

const RANGES: { days: number; label: string }[] = [
  { days: 30, label: '30 ngày' },
  { days: 60, label: '60 ngày' },
  { days: 90, label: '90 ngày' },
];

export default function ChonNgayTotScreen() {
  const { profile } = useApp();
  const router = useRouter();
  const layout = useWindowLayout();
  const [eventId, setEventId] = useState<EventTypeId>('cuoi_hoi');
  const [rangeDays, setRangeDays] = useState(60);
  const [ran, setRan] = useState(false);

  const results = useMemo(() => {
    if (!ran) return [] as GoodDayCandidate[];
    return recommendGoodDays({
      eventId,
      rangeDays,
      birthDate: profile?.birthDate,
      limit: 12,
    });
  }, [ran, eventId, rangeDays, profile?.birthDate]);

  const event = EVENT_TYPES.find((e) => e.id === eventId)!;
  const chipMin = layout.isNarrow ? '46%' : '30%';

  const openOnCalendar = (c: GoodDayCandidate) => {
    const { year, month, day } = c.solar;
    const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    router.push({ pathname: '/(tabs)', params: { day: iso } });
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.title, { fontSize: layout.titleSize }]}>Chọn ngày tốt</Text>
      <Text style={styles.sub}>
        Gợi ý theo việc phổ biến ở Việt Nam · heuristic lịch + tuổi con giáp
        {profile?.birthDate ? ' (đã cá nhân hóa)' : ' (thêm ngày sinh để hợp tuổi)'}
      </Text>

      <Text style={styles.section}>Loại việc</Text>
      <View style={styles.chips}>
        {EVENT_TYPES.map((e) => {
          const active = e.id === eventId;
          return (
            <Pressable
              key={e.id}
              onPress={() => {
                setEventId(e.id);
                setRan(false);
              }}
              style={[
                styles.chip,
                { width: chipMin, minWidth: layout.isNarrow ? '46%' : 108 },
                active && styles.chipActive,
              ]}
            >
              <Text style={styles.chipEmoji}>{e.emoji}</Text>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {e.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ marginTop: 12 }}>
        <Text style={styles.eventBlurb}>
          {event.emoji} {event.label} — {event.blurb}
        </Text>
      </Card>

      <Text style={[styles.section, { marginTop: 16 }]}>Khoảng thời gian</Text>
      <View style={styles.rangeRow}>
        {RANGES.map((r) => {
          const active = r.days === rangeDays;
          return (
            <Pressable
              key={r.days}
              onPress={() => {
                setRangeDays(r.days);
                setRan(false);
              }}
              style={[styles.rangeChip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 14 }} />
      <PrimaryButton title="Xem ngày gợi ý" variant="gold" onPress={() => setRan(true)} />

      {ran ? (
        <>
          <Text style={[styles.section, { marginTop: 18 }]}>
            Gợi ý hàng đầu ({results.length})
          </Text>
          {results.length === 0 ? (
            <Card>
              <Text style={styles.empty}>Không có gợi ý trong khoảng đã chọn.</Text>
            </Card>
          ) : (
            results.map((c) => (
              <Card key={c.iso} style={styles.resultCard}>
                <View style={styles.resultHead}>
                  <Text style={styles.resultDate}>{formatCandidateDate(c)}</Text>
                  <Text
                    style={[
                      styles.badge,
                      c.fortune.dayQuality === 'tot'
                        ? styles.badgeTot
                        : c.fortune.dayQuality === 'xau'
                          ? styles.badgeXau
                          : styles.badgeBinh,
                    ]}
                  >
                    {c.fortune.dayQualityLabel}
                  </Text>
                </View>
                <Text style={styles.canChi}>
                  {c.fortune.canChiDay} · Âm {c.fortune.lunar.day}/{c.fortune.lunar.month}
                  {c.fortune.lunar.leap ? ' (nhuận)' : ''}
                </Text>
                <Text style={styles.score}>Điểm gợi ý: {c.score}</Text>
                {c.reasons.slice(0, 3).map((r) => (
                  <Text key={r} style={styles.reason}>
                    · {r}
                  </Text>
                ))}
                <View style={{ height: 8 }} />
                <PrimaryButton
                  title="Xem trên lịch Hôm nay"
                  variant="ghost"
                  onPress={() => openOnCalendar(c)}
                />
              </Card>
            ))
          )}
        </>
      ) : null}

      <View style={{ height: 12 }} />
      <DisclaimerBanner />
      <Text style={styles.legal}>
        ⚠ {DISCLAIMER}. Gợi ý ngày dựa trên heuristic lịch âm/can chi demo — không thay thế
        thầy lịch / chuyên gia.
      </Text>
      <View style={{ height: 40 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8 },
  title: { color: colors.text, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 12, marginBottom: 12, marginTop: 4, lineHeight: 18 },
  section: { color: colors.gold, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipActive: { borderColor: colors.gold, backgroundColor: '#2A1F3D' },
  chipEmoji: { fontSize: 18 },
  chipLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  chipLabelActive: { color: colors.goldSoft, fontWeight: '700' },
  eventBlurb: { color: colors.text, lineHeight: 20 },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  resultCard: { marginBottom: 10 },
  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  resultDate: { color: colors.text, fontWeight: '800', fontSize: 17 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    color: colors.text,
  },
  badgeTot: { backgroundColor: colors.chipGood },
  badgeXau: { backgroundColor: colors.chipBad },
  badgeBinh: { backgroundColor: colors.border },
  canChi: { color: colors.purpleSoft, marginTop: 6, fontSize: 13 },
  score: { color: colors.gold, marginTop: 6, fontWeight: '600', fontSize: 13 },
  reason: { color: colors.textMuted, marginTop: 4, fontSize: 13, lineHeight: 18 },
  empty: { color: colors.textMuted },
  legal: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
});
