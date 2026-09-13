import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWindowLayout } from '@/src/hooks/useWindowLayout';
import { colors } from '@/src/theme/colors';

type Props = {
  children: ReactNode;
  /** Scrollable page (default true). FlatList screens should use false + wrap manually. */
  scroll?: boolean;
  /** Extra bottom padding inside content */
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Skip top safe area when a nav header already accounts for it */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
};

/**
 * Full-bleed background + centered max-width column for foldables / large screens.
 * Uses flex + percentage; no fixed pixel page widths.
 */
export function Screen({
  children,
  scroll = true,
  contentStyle,
  style,
  edges = ['left', 'right', 'bottom'],
  keyboardShouldPersistTaps = 'handled',
}: Props) {
  const layout = useWindowLayout();
  const insets = useSafeAreaInsets();

  const padL =
    (edges.includes('left') ? Math.max(insets.left, 0) : 0) +
    layout.horizontalPadding;
  const padR =
    (edges.includes('right') ? Math.max(insets.right, 0) : 0) +
    layout.horizontalPadding;
  const padT = edges.includes('top') ? Math.max(insets.top, 8) : 0;
  const padB = edges.includes('bottom') ? Math.max(insets.bottom, 8) : 8;

  const columnStyle: ViewStyle = {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingLeft: padL,
    paddingRight: padR,
    paddingTop: padT,
    paddingBottom: padB,
    flexGrow: 1,
  };

  if (scroll) {
    return (
      <View style={[styles.root, style]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[columnStyle, contentStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.flex, columnStyle, contentStyle]}>{children}</View>
    </View>
  );
}

/** Non-scrolling centered column for chat / FlatList parents */
export function ContentColumn({
  children,
  style,
  includeHorizontalSafe = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  includeHorizontalSafe?: boolean;
}) {
  const layout = useWindowLayout();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          flex: 1,
          paddingLeft:
            layout.horizontalPadding +
            (includeHorizontalSafe ? insets.left : 0),
          paddingRight:
            layout.horizontalPadding +
            (includeHorizontalSafe ? insets.right : 0),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
});
