import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { AdPlaceholder } from '@/src/components/AdPlaceholder';
import { Card } from '@/src/components/Card';
import { DayDetailCard } from '@/src/components/DayDetailCard';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { MonthCalendar } from '@/src/components/MonthCalendar';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { SoftTrialNudge, TrialBanner } from '@/src/components/TrialBanner';
import { TrialErrorBanner } from '@/src/components/TrialErrorBanner';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import { useWindowLayout } from '@/src/hooks/useWindowLayout';
import { formatTrialCountdown } from '@/src/lib/entitlement';
import {
  getPersonalizedDayFortune,
  type MonthCell,
} from '@/src/lib/personalizedFortune';
import { syncHomeWidget } from '@/src/widgets/syncHomeWidget';
import { colors } from '@/src/theme/colors';

export default function HomNayScreen() {
  const { profile, traits, entitlement } = useApp();
  const { effectivePro, isProPaid } = useEffectivePro();
  const router = useRouter();
  const layout = useWindowLayout();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });

  const params = useLocalSearchParams<{ day?: string }>();

  useEffect(() => {
    const raw = typeof params.day === 'string' ? params.day : Array.isArray(params.day) ? params.day[0] : '';
    const m = raw && raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!y || !mo || !d) return;
    setSelected({ year: y, month: mo, day: d });
    setViewYear(y);
    setViewMonth(mo);
  }, [params.day]);

  useEffect(() => {
    const applyDayUrl = (url: string | null) => {
      if (!url) return;
      const m = url.match(/day\/(\d{4})-(\d{2})-(\d{2})/i);
      if (!m) return;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      if (!y || !mo || !d) return;
      setSelected({ year: y, month: mo, day: d });
      setViewYear(y);
      setViewMonth(mo);
    };
    void Linking.getInitialURL().then(applyDayUrl);
    const sub = Linking.addEventListener('url', ({ url }) => applyDayUrl(url));
    return () => sub.remove();
  }, []);

  const person = useMemo(
    () =>
      profile?.birthDate
        ? {
            birthDate: profile.birthDate,
            displayName: profile.displayName,
            traits,
          }
        : null,
    [profile, traits],
  );

  const fortune = useMemo(() => {
    const d = new Date(selected.year, selected.month - 1, selected.day);
    return getPersonalizedDayFortune(d, person);
  }, [selected, person]);

  // Best-effort widget refresh when profile/fortune changes (no-op on iOS/web/Expo Go)
  useEffect(() => {
    void syncHomeWidget(fortune);
  }, [fortune]);

  const statusLabel = isProPaid
    ? 'Pro ✨'
    : entitlement.trialActive
      ? `Trial · ${formatTrialCountdown(entitlement)}`
      : 'Free';

  const chipMin = layout.isNarrow ? '46%' : layout.useTwoColumn ? '22%' : '30%';

  const onSelectDay = (cell: MonthCell) => {
    setSelected({
      year: cell.solarYear,
      month: cell.solarMonth,
      day: cell.solarDay,
    });
    if (cell.solarMonth !== viewMonth || cell.solarYear !== viewYear) {
      setViewYear(cell.solarYear);
      setViewMonth(cell.solarMonth);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <TrialBanner onPressPro={() => router.push('/pro')} />
      <TrialErrorBanner />
      <SoftTrialNudge onUpgrade={() => router.push('/pro')} />

      <Text style={styles.hello}>
        Xin chào{profile?.displayName ? `, ${profile.displayName}` : ''} 👋
      </Text>
      <Text style={[styles.brand, { fontSize: layout.titleSize }]}>
        Lịch vạn sự
      </Text>
      <Text style={styles.sub}>
        Lưới tháng dương + âm · chạm ngày để xem chi tiết
        {fortune.personalized ? ' · đã cá nhân hóa' : ''}
        {' · '}
        {statusLabel}
      </Text>

      <MonthCalendar
        year={viewYear}
        month={viewMonth}
        selected={selected}
        onChangeMonth={(y, m) => {
          setViewYear(y);
          setViewMonth(m);
        }}
        onSelectDay={onSelectDay}
      />

      <View style={layout.useTwoColumn ? styles.twoCol : undefined}>
        <View style={layout.useTwoColumn ? styles.col : undefined}>
          <DayDetailCard fortune={fortune} bodySize={layout.bodySize} />
        </View>

        <View style={layout.useTwoColumn ? styles.col : undefined}>
          <Text style={styles.section}>Giờ hoàng đạo</Text>
          <Card>
            <View style={styles.hours}>
              {fortune.hoangDaoHours.map((h) => (
                <View
                  key={h.name}
                  style={[
                    styles.hourChip,
                    { width: chipMin, minWidth: layout.isNarrow ? '46%' : 96 },
                    h.good ? styles.hourGood : styles.hourBad,
                  ]}
                >
                  <Text style={styles.hourName}>{h.name}</Text>
                  <Text style={styles.hourRange}>{h.range}</Text>
                  <Text style={styles.hourTag}>
                    {h.good ? 'Hoàng đạo' : 'Hắc đạo'}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <View style={{ height: 12 }} />
      <PrimaryButton
        title="📅 Chọn ngày tốt theo việc"
        variant="gold"
        onPress={() => router.push('/chon-ngay-tot')}
      />
      <View style={{ height: 8 }} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8 },
  hello: { color: colors.textMuted, fontSize: 14 },
  brand: { color: colors.text, fontWeight: '800', marginBottom: 2, marginTop: 2 },
  sub: { color: colors.textMuted, fontSize: 12, marginBottom: 12 },
  twoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  col: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '46%',
    minWidth: 260,
  },
  section: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourChip: {
    flexGrow: 1,
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
