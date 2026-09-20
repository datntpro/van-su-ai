import type { WidgetTaskHandler } from 'react-native-android-widget';

import { VanSuDayWidget, WIDGET_NAME } from '@/src/widgets/VanSuDayWidget';
import { loadWidgetFortune } from '@/src/widgets/loadWidgetFortune';

export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetInfo,
  widgetAction,
  renderWidget,
}) => {
  if (widgetInfo.widgetName !== WIDGET_NAME) return;
  if (widgetAction === 'WIDGET_DELETED') return;

  const fortune = await loadWidgetFortune(new Date());
  renderWidget(<VanSuDayWidget fortune={fortune} />);
};
