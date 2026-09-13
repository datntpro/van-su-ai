import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { SupabaseBanner } from '@/src/components/SupabaseBanner';
import { useAuth } from '@/src/context/AuthContext';
import { useWindowLayout } from '@/src/hooks/useWindowLayout';
import { colors } from '@/src/theme/colors';

export default function RegisterScreen() {
  const { signUp, supabaseConfigured } = useAuth();
  const router = useRouter();
  const layout = useWindowLayout();
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
        'Xác nhận email',
        'Chúng tôi đã gửi liên kết xác nhận tới hộp thư của bạn (kiểm tra cả thư mục spam). Sau khi bấm xác nhận, hãy quay lại app và đăng nhập.\n\nKhi đã vào app và hoàn tất ngày sinh, bạn sẽ nhận Trial Pro 7 ngày (một lần / tài khoản).',
        [{ text: 'Tới đăng nhập', onPress: () => router.replace('/(auth)/login') }],
      );
      return;
    }
    if (supabaseConfigured) {
      Alert.alert(
        'Đăng ký thành công',
        'Hoàn tất ngày sinh ở bước tiếp theo để bắt đầu Trial Pro 7 ngày.',
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
        <Screen
          edges={['top', 'left', 'right', 'bottom']}
          contentStyle={{ paddingTop: layout.safePaddingTop + 24 }}
        >
          <Text style={styles.kicker}>VAN SU AI</Text>
          <Text style={[styles.title, { fontSize: layout.isNarrow ? 28 : 32 }]}>
            Đăng ký
          </Text>
          <Text style={styles.sub}>
            {supabaseConfigured
              ? 'Tạo tài khoản email. Sau onboarding ngày sinh bạn nhận Trial Pro 7 ngày (một lần).'
              : 'Chế độ demo (chưa Supabase): session chỉ trên máy — không có trial cloud.'}
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

          <Text style={styles.legal}>
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <Link href="/legal/terms" style={styles.linkInline}>
              Điều khoản
            </Link>{' '}
            và{' '}
            <Link href="/legal/privacy" style={styles.linkInline}>
              Chính sách quyền riêng tư
            </Link>
            .
          </Text>

          <View style={{ height: 20 }} />
          <PrimaryButton title="Đăng ký" onPress={onSubmit} loading={loading} variant="gold" />

          <Text style={styles.footer}>
            Đã có tài khoản?{' '}
            <Link href="/(auth)/login" style={styles.link}>
              Đăng nhập
            </Link>
          </Text>
        </Screen>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  kicker: {
    color: colors.gold,
    letterSpacing: 2,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    color: colors.text,
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
    width: '100%',
  },
  error: { color: colors.danger, marginTop: 12 },
  legal: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
  linkInline: { color: colors.gold, fontWeight: '700' },
  footer: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
  link: { color: colors.gold, fontWeight: '700' },
});
