import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';

import { AdPlaceholder } from '@/src/components/AdPlaceholder';
import { Card } from '@/src/components/Card';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { PaywallSheet } from '@/src/components/PaywallSheet';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useEffectivePro } from '@/src/context/AppContext';
import { mockFaceAnalysis } from '@/src/lib/face-analysis';
import { canUseFace, consumeFace, FREE_LIMITS } from '@/src/lib/limits';
import { colors } from '@/src/theme/colors';

export default function TuongSoScreen() {
  const { effectivePro } = useEffectivePro();
  const [uri, setUri] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paywall, setPaywall] = useState(false);

  const refreshLimit = useCallback(async () => {
    const r = await canUseFace(effectivePro);
    setRemaining(r.remaining);
  }, [effectivePro]);

  useFocusEffect(
    useCallback(() => {
      refreshLimit();
    }, [refreshLimit]),
  );

  const pickAndAnalyze = async () => {
    const gate = await canUseFace(effectivePro);
    if (!gate.ok) {
      setPaywall(true);
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền ảnh', 'Cho phép truy cập thư viện để chọn ảnh chân dung.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (picked.canceled || !picked.assets[0]) return;

    const asset = picked.assets[0];
    setUri(asset.uri);
    setLoading(true);
    setResult('');
    try {
      const text = await mockFaceAnalysis(asset.uri);
      await consumeFace(effectivePro);
      setResult(text);
      await refreshLimit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tướng số AI</Text>
      <Text style={styles.sub}>
        {effectivePro
          ? 'Pro / Trial · Không giới hạn'
          : `Free · Còn ${remaining ?? '…'}/${FREE_LIMITS.facePerWeek} lượt tuần này`}
      </Text>

      <PrimaryButton
        title="Chọn ảnh & phân tích"
        onPress={pickAndAnalyze}
        loading={loading}
        variant="gold"
      />

      {uri ? (
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
      ) : null}

      {result ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.body}>{result}</Text>
        </Card>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.placeholder}>
            Chọn ảnh chân dung rõ nét. Không dùng ảnh trẻ em. Kết quả chỉ để giải trí.
          </Text>
        </Card>
      )}

      {!effectivePro ? (
        <>
          <View style={{ height: 12 }} />
          <AdPlaceholder placement="banner_home" />
        </>
      ) : null}
      <View style={{ height: 12 }} />
      <DisclaimerBanner />
      <View style={{ height: 32 }} />

      <PaywallSheet
        visible={paywall}
        feature="face"
        remaining={remaining ?? 0}
        onClose={() => setPaywall(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textMuted, marginBottom: 16, marginTop: 4 },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { color: colors.text, lineHeight: 24, fontSize: 15 },
  placeholder: { color: colors.textMuted, lineHeight: 22 },
});
