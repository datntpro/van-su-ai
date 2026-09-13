import { Modal, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { DISCLAIMER, colors } from '@/src/theme/colors';
import { FREE_LIMITS } from '@/src/lib/limits';
import { useWindowLayout } from '@/src/hooks/useWindowLayout';

export type PaywallFeature = 'horoscope' | 'face' | 'chat';

const COPY: Record<
  PaywallFeature,
  { title: string; limitLine: string }
> = {
  horoscope: {
    title: 'Hết lượt tử vi Free',
    limitLine: `Free: ${FREE_LIMITS.horoscopePerDay} lần/ngày`,
  },
  face: {
    title: 'Hết lượt tướng số Free',
    limitLine: `Free: ${FREE_LIMITS.facePerWeek} lần/tuần`,
  },
  chat: {
    title: 'Hết tin nhắn Free',
    limitLine: `Free: ${FREE_LIMITS.chatMessages} tin/ngày`,
  },
};

export function PaywallSheet({
  visible,
  feature,
  remaining = 0,
  onClose,
}: {
  visible: boolean;
  feature: PaywallFeature;
  remaining?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const layout = useWindowLayout();
  const c = COPY[feature];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              width: '100%',
              maxWidth: layout.contentMaxWidth,
              alignSelf: 'center',
              paddingBottom: Math.max(layout.safePaddingBottom, 36),
            },
          ]}
        >
          <Text style={styles.kicker}>NÂNG CẤP</Text>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.body}>
            {c.limitLine}. Còn lại: {remaining}. Dùng Pro (hoặc Trial Pro) để không giới hạn tử
            vi, tướng số và chat — đồng thời ẩn quảng cáo.
          </Text>
          <Text style={styles.disclaimer}>⚠ {DISCLAIMER}</Text>
          <View style={{ height: 14 }} />
          <PrimaryButton
            title="Dùng Pro"
            variant="gold"
            onPress={() => {
              onClose();
              router.push('/pro');
            }}
          />
          <View style={{ height: 8 }} />
          <PrimaryButton title="Để sau" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: colors.gold,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 36,
  },
  kicker: { color: colors.gold, fontWeight: '700', letterSpacing: 1, fontSize: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 6 },
  body: { color: colors.textMuted, marginTop: 10, lineHeight: 22, fontSize: 15 },
  disclaimer: { color: colors.textMuted, marginTop: 12, fontSize: 12, lineHeight: 18 },
});
