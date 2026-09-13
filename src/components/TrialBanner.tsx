import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/src/context/AppContext';
import { formatTrialCountdown } from '@/src/lib/entitlement';
import { colors } from '@/src/theme/colors';

export function TrialBanner({
  onPressPro,
}: {
  onPressPro?: () => void;
}) {
  const { entitlement, trialJustStarted, clearTrialJustStarted, isProPaid } = useApp();

  if (isProPaid) return null;

  if (trialJustStarted) {
    return (
      <Pressable
        style={[styles.wrap, styles.started]}
        onPress={() => {
          clearTrialJustStarted();
          onPressPro?.();
        }}
      >
        <Text style={styles.text}>✨ Pro dùng thử · 7 ngày — chạm để xem chi tiết</Text>
      </Pressable>
    );
  }

  if (!entitlement.trialActive) return null;

  return (
    <Pressable style={styles.wrap} onPress={onPressPro}>
      <Text style={styles.text}>⏱ {formatTrialCountdown(entitlement)}</Text>
    </Pressable>
  );
}

/** Soft paywall nudge on day 5–6 — non-blocking. */
export function SoftTrialNudge({ onUpgrade }: { onUpgrade?: () => void }) {
  const { entitlement, isProPaid } = useApp();
  if (isProPaid || !entitlement.softPaywallSuggested) return null;
  return (
    <View style={[styles.wrap, styles.soft]}>
      <Text style={styles.text}>
        Trial sắp hết ({entitlement.trialDaysRemaining} ngày). Nâng Pro để giữ không giới hạn.
      </Text>
      {onUpgrade ? (
        <Pressable onPress={onUpgrade}>
          <Text style={styles.link}>Xem Pro →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  started: { borderColor: colors.purple, backgroundColor: '#1a1030' },
  soft: { borderColor: colors.warning },
  text: { color: colors.goldSoft, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  link: {
    color: colors.gold,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
  },
});
