import React from 'react';
import { Platform } from 'react-native';

import type { PersonalizedDayFortune } from '@/src/lib/personalizedFortune';
import { VanSuDayWidget, WIDGET_NAME } from '@/src/widgets/VanSuDayWidget';

/**
 * Push latest fortune to Android home widgets.
 * Safe no-op on iOS / web / Expo Go (native module missing).
 */
export async function syncHomeWidget(
  fortune?: PersonalizedDayFortune,
): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { loadWidgetFortune } = await import('@/src/widgets/loadWidgetFortune');
    const data = fortune ?? (await loadWidgetFortune(new Date()));
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => <VanSuDayWidget fortune={data} />,
      widgetNotFound: () => {
        /* no widget pinned — ignore */
      },
    });
  } catch {
    // Expo Go / missing native binary — ignore
  }
}
