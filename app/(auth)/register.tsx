import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SupabaseBanner } from '@/src/components/SupabaseBanner';
import { useAuth } from '@/src/context/AuthContext';
import { colors } from '@/src/theme/colors';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    const res = await signUp(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.needsConfirm) {
      Alert.alert(
        'Kiểm tra email',
        'Đã gửi liên kết xác nhận. Sau khi xác nhận, hãy đăng nhập.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    }
  };

  return (
    <View style={styles.root}>
      <SupabaseBanner />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.kicker}>VAN SU AI</Text>
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.sub}>
            Tạo tài khoản bằng email. Hồ sơ ngày sinh sẽ đồng bộ lên Supabase khi đã cấu hình.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="ban@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor={colors.textMuted}
            value={confirm}
            onChangeText={setConfirm}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ height: 20 }} />
          <PrimaryButton title="Đăng ký" onPress={onSubmit} loading={loading} variant="gold" />

          <Text style={styles.footer}>
            Đã có tài khoản?{' '}
            <Link href="/(auth)/login" style={styles.link}>
              Đăng nhập
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64 },
  kicker: {
    color: colors.gold,
    letterSpacing: 2,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  sub: {
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    color: colors.purpleSoft,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
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
  error: { color: colors.danger, marginTop: 12 },
  footer: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
  link: { color: colors.gold, fontWeight: '700' },
});
