import { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { useApp } from '@/src/context/AppContext';
import { colors } from '@/src/theme/colors';
import type { UserProfile } from '@/src/lib/profile';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function OnboardingModal({ visible }: { visible: boolean }) {
  const { setProfile } = useApp();
  const [birthDate, setBirthDate] = useState(new Date(1995, 0, 1));
  const [showDate, setShowDate] = useState(Platform.OS === 'ios');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setError('');
    if (!birthDate) {
      setError('Vui lòng chọn ngày sinh.');
      return;
    }
    setSaving(true);
    const profile: UserProfile = {
      birthDate: toISODate(birthDate),
      birthTime: birthTime.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      displayName: displayName.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await setProfile(profile);
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.kicker}>Chào mừng</Text>
            <Text style={styles.title}>Van Su AI</Text>
            <Text style={styles.sub}>
              Nhập thông tin để nhận lịch vạn sự & tử vi cá nhân hóa (giải trí).
            </Text>

            <Text style={styles.label}>Tên gọi (tuỳ chọn)</Text>
            <TextInput
              style={styles.input}
              placeholder="Bạn muốn được gọi là…"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text style={styles.label}>Ngày sinh *</Text>
            <PrimaryButton
              title={`📅 ${toISODate(birthDate)}`}
              variant="ghost"
              onPress={() => setShowDate(true)}
            />
            {showDate && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, d) => {
                  if (Platform.OS !== 'ios') setShowDate(false);
                  if (d) setBirthDate(d);
                }}
                themeVariant="dark"
              />
            )}

            <Text style={styles.label}>Giờ sinh (tuỳ chọn, HH:mm)</Text>
            <TextInput
              style={styles.input}
              placeholder="vd: 08:30"
              placeholderTextColor={colors.textMuted}
              value={birthTime}
              onChangeText={setBirthTime}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Nơi sinh (tuỳ chọn)</Text>
            <TextInput
              style={styles.input}
              placeholder="vd: Hà Nội"
              placeholderTextColor={colors.textMuted}
              value={birthPlace}
              onChangeText={setBirthPlace}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={{ height: 12 }} />
            <DisclaimerBanner />
            <View style={{ height: 16 }} />
            <PrimaryButton title="Bắt đầu" onPress={onSave} loading={saving} variant="gold" />
          </ScrollView>
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
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: colors.purple,
    borderWidth: 1,
  },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: colors.gold, fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  sub: { color: colors.textMuted, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  label: { color: colors.purpleSoft, marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.danger, marginTop: 10 },
});
