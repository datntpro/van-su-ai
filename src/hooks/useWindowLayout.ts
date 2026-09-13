import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  computeWindowLayout,
  type WindowLayout,
} from '@/src/theme/layout';

export type WindowLayoutWithInsets = WindowLayout & {
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  /** paddingTop including safe area (for screens without nav header) */
  safePaddingTop: number;
  /** paddingBottom including home indicator / gesture bar */
  safePaddingBottom: number;
};

/**
 * Live window size + safe-area insets.
 * Re-renders on fold open/close and rotation (when orientation allows).
 */
export function useWindowLayout(): WindowLayoutWithInsets {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const base = computeWindowLayout(width, height);
    return {
      ...base,
      insets: {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      },
      safePaddingTop: Math.max(insets.top, 8),
      safePaddingBottom: Math.max(insets.bottom, 8),
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right]);
}
