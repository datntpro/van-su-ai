import { Modal, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useApp } from '@/src/context/AppContext';
import { FREE_LIMITS } from '@/src/lib/limits';
import { DISCLAIMER, colors } from '@/src/theme/colors';

export function TrialExpiredModal() {
  const { showTrialExpiredModal, dismissTrialExpiredModal } = useApp();
  const router = useRouter();

  return (
    <Modal
      visible={showTrialExpiredModal}
      animationType="fade"
      transparent
      onRequestClose={dismissTrialExpiredModal}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Hết dùng thử Pro</Text>
          <Text style={styles.body}>
            Bạn đã về gói Free: {FREE_LIMITS.horoscopePerDay} tử vi/ngày,{' '}
            {FREE_LIMITS.facePerWeek} tướng số/tuần, {FREE_LIMITS.chatMessages} chat/ngày + quảng
            cáo. Nâng Pro để tiếp tục không giới hạn?
          </Text>
          <Text style={styles.disclaimer}>⚠ {DISCLAIMER}</Text>
          <View style={{ height: 14 }} />
          <PrimaryButton
            title="Nâng Pro"
            variant="gold"
            onPress={() => {
              dismissTrialExpiredModal();
              router.push('/pro');
            }}
          />
          <View style={{ height: 8 }} />
          <PrimaryButton title="Để sau" variant="ghost" onPress={dismissTrialExpiredModal} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.purple,
    padding: 22,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  body: { color: colors.textMuted, marginTop: 10, lineHeight: 22, fontSize: 15 },
  disclaimer: { color: colors.textMuted, marginTop: 12, fontSize: 12 },
});
