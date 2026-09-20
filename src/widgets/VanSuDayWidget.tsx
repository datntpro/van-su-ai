/**
 * Android home-screen widget UI (react-native-android-widget primitives).
 * Compact table-like rows — no disclaimer text on the widget.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { PersonalizedDayFortune } from '@/src/lib/personalizedFortune';
import { formatLunarCompact, formatSolar } from '@/src/lib/calendar';

export const WIDGET_NAME = 'VanSuDay';

export type WidgetPayload = {
  fortune: PersonalizedDayFortune;
};

function qualityColor(q: PersonalizedDayFortune['dayQuality']): `#${string}` {
  if (q === 'tot') return '#34D399';
  if (q === 'xau') return '#F87171';
  return '#FBBF24';
}

function Row({
  label,
  value,
  valueColor = '#F8F5FF',
}: {
  label: string;
  value: string;
  valueColor?: `#${string}`;
}) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        width: 'match_parent',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 3,
        paddingBottom: 3,
      }}
    >
      <TextWidget
        text={label}
        style={{ fontSize: 11, color: '#A89BB8', fontWeight: '600' }}
      />
      <TextWidget
        text={value}
        style={{ fontSize: 12, color: valueColor, fontWeight: '700' }}
      />
    </FlexWidget>
  );
}

export function VanSuDayWidget({ fortune }: WidgetPayload) {
  const solar = formatSolar(fortune.solar);
  const lunar = formatLunarCompact(fortune.lunar);
  const summary = fortune.widgetSummary || fortune.summary;
  const uri = `vansuai://day/${fortune.solar.year}-${String(fortune.solar.month).padStart(2, '0')}-${String(fortune.solar.day).padStart(2, '0')}`;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0B0614',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text="Van Su AI"
        style={{ fontSize: 10, color: '#A78BFA', fontWeight: '600' }}
      />

      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          marginTop: 4,
        }}
      >
        <Row label="Dương" value={solar} valueColor="#F5C542" />
        <Row label="Âm" value={lunar} valueColor="#A78BFA" />
        <Row label="Can chi" value={fortune.canChiDay} />
        <Row
          label="Chất ngày"
          value={fortune.dayQualityLabel}
          valueColor={qualityColor(fortune.dayQuality)}
        />
      </FlexWidget>

      <TextWidget
        text={summary}
        style={{ fontSize: 11, color: '#F8F5FF', marginTop: 4 }}
        maxLines={2}
      />
    </FlexWidget>
  );
}
