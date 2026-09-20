import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/Card';
import {
  WEEKDAY_LABELS_VI,
  buildMonthGrid,
  shiftMonth,
  type MonthCell,
} from '@/src/lib/personalizedFortune';
import { colors } from '@/src/theme/colors';

type Props = {
  year: number;
  month: number;
  selected?: { year: number; month: number; day: number } | null;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDay: (cell: MonthCell) => void;
};

function qualityDot(q: MonthCell['dayQuality']): string {
  if (q === 'tot') return colors.success;
  if (q === 'xau') return colors.danger;
  return colors.warning;
}

export function MonthCalendar({
  year,
  month,
  selected,
  onChangeMonth,
  onSelectDay,
}: Props) {
  const grid = buildMonthGrid(year, month);
  const title = `Tháng ${month}/${year}`;

  const go = (delta: number) => {
    const n = shiftMonth(year, month, delta);
    onChangeMonth(n.year, n.month);
  };

  return (
    <Card style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => go(-12)}
          hitSlop={8}
          accessibilityLabel="Năm trước"
          style={styles.navBtn}
        >
          <Text style={styles.navText}>«</Text>
        </Pressable>
        <Pressable
          onPress={() => go(-1)}
          hitSlop={8}
          accessibilityLabel="Tháng trước"
          style={styles.navBtn}
        >
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={() => go(1)}
          hitSlop={8}
          accessibilityLabel="Tháng sau"
          style={styles.navBtn}
        >
          <Text style={styles.navText}>›</Text>
        </Pressable>
        <Pressable
          onPress={() => go(12)}
          hitSlop={8}
          accessibilityLabel="Năm sau"
          style={styles.navBtn}
        >
          <Text style={styles.navText}>»</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS_VI.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.cells.map((cell) => {
          const isSelected =
            selected &&
            selected.year === cell.solarYear &&
            selected.month === cell.solarMonth &&
            selected.day === cell.solarDay;
          return (
            <Pressable
              key={`${cell.solarYear}-${cell.solarMonth}-${cell.solarDay}`}
              onPress={() => onSelectDay(cell)}
              style={[
                styles.cell,
                !cell.inCurrentMonth && styles.cellOutside,
                cell.isToday && styles.cellToday,
                isSelected && styles.cellSelected,
              ]}
            >
              <Text
                style={[
                  styles.solarDay,
                  !cell.inCurrentMonth && styles.muted,
                  cell.isToday && styles.todayText,
                ]}
              >
                {cell.solarDay}
              </Text>
              <Text style={[styles.lunarDay, !cell.inCurrentMonth && styles.muted]}>
                {cell.lunarDay}
                {cell.lunarDay === 1 ? `/${cell.lunarMonth}` : ''}
              </Text>
              <View
                style={[styles.dot, { backgroundColor: qualityDot(cell.dayQuality) }]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.legend}>
        Chấm xanh = tốt · vàng = bình · đỏ = xấu · số nhỏ = ngày âm
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { borderColor: colors.purple, marginBottom: 12, paddingVertical: 12 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 4,
  },
  navBtn: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  navText: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  cellOutside: { opacity: 0.45 },
  cellToday: {
    borderWidth: 1,
    borderColor: colors.gold,
  },
  cellSelected: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.purpleSoft,
  },
  solarDay: { color: colors.text, fontWeight: '700', fontSize: 14 },
  todayText: { color: colors.gold },
  lunarDay: { color: colors.purpleSoft, fontSize: 9, marginTop: 1 },
  muted: { color: colors.textMuted },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  legend: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
});
