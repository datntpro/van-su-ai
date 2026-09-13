import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/src/context/AppContext';
import { colors } from '@/src/theme/colors';

/** Shown when start_trial_if_eligible RPC fails — no client write of trial fields. */
export function TrialErrorBanner() {
  const { trialStartError, retryStartTrial, clearTrialStartError, entitlement } = useApp();
  if (!trialStartError) return null;
  if (entitlement.trialActive || entitlement.trialConsumed) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{trialStartError}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => retryStartTrial()}>
          <Text style={styles.link}>Thử lại trial</Text>
        </Pressable>
        <Pressable onPress={clearTrialStartError}>
          <Text style={styles.dismiss}>Ẩn</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#3B1520',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  text: { color: colors.goldSoft, fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 16, marginTop: 8 },
  link: { color: colors.gold, fontWeight: '700', fontSize: 13 },
  dismiss: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
});
