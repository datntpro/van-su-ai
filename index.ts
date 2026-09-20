/**
 * Custom Expo entry — registers Android widget task handler before Router.
 * See docs/WIDGETS.md. Requires a native rebuild (not Expo Go).
 */
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Expo Go / web preview without native widget module
  }
}

import 'expo-router/entry';
