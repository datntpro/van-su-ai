/**
 * Android home-screen widget UI (react-native-android-widget primitives).
 * Not a React Native View tree — only FlexWidget / TextWidget etc.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { PersonalizedDayFortune } from '@/src/lib/personalizedFortune';
import { formatLunar, formatSolar } from '@/src/lib/calendar';

export const WIDGET_NAME = 'VanSuDay';

export type WidgetPayload = {
  fortune: PersonalizedDayFortune;
};

function qualityColor(q: PersonalizedDayFortune['dayQuality']): `#${string}` {
  if (q === 'tot') return '#34D399';
  if (q === 'xau') return '#F87171';
  return '#FBBF24';
}

export function VanSuDayWidget({ fortune }: WidgetPayload) {
  const solar = formatSolar(fortune.solar);
  const lunar = formatLunar(fortune.lunar);
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
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text="Van Su AI"
        style={{ fontSize: 11, color: '#A78BFA', fontWeight: '600' }}
      />
      <TextWidget
        text={solar}
        style={{ fontSize: 18, color: '#F5C542', fontWeight: '800' }}
      />
      <TextWidget
        text={lunar}
        style={{ fontSize: 12, color: '#A89BB8' }}
      />
      <TextWidget
        text={fortune.dayQualityLabel}
        style={{
          fontSize: 13,
          color: qualityColor(fortune.dayQuality),
          fontWeight: '700',
        }}
      />
      <TextWidget
        text={summary}
        style={{ fontSize: 12, color: '#F8F5FF' }}
        maxLines={2}
      />
      <TextWidget
        text="Chỉ mang tính giải trí"
        style={{ fontSize: 9, color: '#A89BB8' }}
      />
    </FlexWidget>
  );
}
