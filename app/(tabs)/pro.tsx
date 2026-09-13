import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Card } from '@/src/components/Card';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SoftTrialNudge } from '@/src/components/TrialBanner';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { SupabaseBanner } from '@/src/components/SupabaseBanner';
import { formatTrialCountdown } from '@/src/lib/entitlement';
import { canShowDemoProToggle } from '@/src/lib/flags';
import { FREE_LIMITS } from '@/src/lib/limits';
import {
  purchasePro,
  restorePurchases,
  isRevenueCatConfigured,
} from '@/src/services/revenuecat';
import { colors, DISCLAIMER } from '@/src/theme/colors';

const ROWS: { feature: string; free: string; trial: string; pro: string }[] = [
  { feature: 'Lịch vạn sự hôm nay', free: '✓', trial: '✓', pro: '✓' },
  {
    feature: 'Tử vi ngày',
    free: `${FREE_LIMITS.horoscopePerDay}/ngày`,
    trial: 'Unlimited',
    pro: 'Unlimited',
  },
  {
    feature: 'Tướng số (ảnh)',
    free: `${FREE_LIMITS.facePerWeek}/tuần`,
    trial: 'Unlimited',
    pro: 'Unlimited',
  },
  {
    feature: 'Chat AI',
    free: `${FREE_LIMITS.chatMessages} tin/ngày`,
    trial: 'Unlimited',
    pro: 'Unlimited',
  },
  { feature: 'Quảng cáo', free: 'Có', trial: 'Không', pro: 'Không' },
  { feature: 'Countdown trial', free: '—', trial: '✓', pro: '—' },
];

export default function ProScreen() {
  const {
    setIsPro,
    profile,
    traits,
    clearProfile,
    entitlement,
    applyPaidFromRevenueCat,
  } = useApp();
  const { effectivePro, isProPaid } = useEffectivePro();
  const { signOut, user, isDemoAuth, supabaseConfigured } = useAuth();
  const showDemo = canShowDemoProToggle();

  const statusLine = (() => {
    if (isProPaid) return 'Bạn đang dùng Pro (đã mua)';
    if (entitlement.trialActive)
      return `Pro dùng thử · ${formatTrialCountdown(entitlement)}`;
    if (entitlement.trialExpired) return 'Trial đã hết · đang Free';
    if (isDemoAuth) return 'Demo / offline · không có trial cloud';
    return 'Gói Free · nâng cấp để mở khoá';
  })();

  const onPurchase = async () => {
    const res = await purchasePro();
    if (res.paid) await applyPaidFromRevenueCat(true);
    Alert.alert('In-App Purchase', res.message);
  };

  const onRestore = async () => {
    const res = await restorePurchases();
    if (res.paid) await applyPaidFromRevenueCat(true);
    Alert.alert(
      'Khôi phục',
      res.message + (res.paid ? '' : '\n(Restore không gia hạn trial.)'),
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SupabaseBanner />
      <Text style={styles.title}>Pro / Cài đặt</Text>
      <Text style={styles.sub}>{statusLine}</Text>

      <SoftTrialNudge onUpgrade={() => {}} />

      <Card style={{ borderColor: colors.gold }}>
        <Text style={styles.matrixTitle}>Free · Trial 7 ngày · Pro</Text>
        <View style={styles.rowHead}>
          <Text style={[styles.cell, styles.head, { flex: 1.5 }]}>Tính năng</Text>
          <Text style={[styles.cell, styles.head]}>Free</Text>
          <Text style={[styles.cell, styles.head, { color: colors.purpleSoft }]}>Trial</Text>
          <Text style={[styles.cell, styles.head, { color: colors.gold }]}>Pro</Text>
        </View>
        {ROWS.map((r) => (
          <View key={r.feature} style={styles.row}>
            <Text style={[styles.cell, { flex: 1.5, textAlign: 'left' }]}>{r.feature}</Text>
            <Text style={styles.cell}>{r.free}</Text>
            <Text style={[styles.cell, { color: colors.purpleSoft }]}>{r.trial}</Text>
            <Text style={[styles.cell, { color: colors.goldSoft }]}>{r.pro}</Text>
          </View>
        ))}
      </Card>

      {entitlement.trialActive ? (
        <Card style={{ marginTop: 14, borderColor: colors.gold }}>
          <Text style={styles.matrixTitle}>Trạng thái Trial</Text>
          <Text style={styles.profileLine}>{formatTrialCountdown(entitlement)}</Text>
          <Text style={styles.switchHint}>
            Hết hạn: {entitlement.trialEndsAt
              ? new Date(entitlement.trialEndsAt).toLocaleString('vi-VN')
              : '—'}
          </Text>
        </Card>
      ) : null}

      {showDemo ? (
        <Card style={{ marginTop: 14 }}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Mở khóa Pro (demo · __DEV__)</Text>
              <Text style={styles.switchHint}>
                Chỉ hiện khi __DEV__. Store build / production ẩn hoàn toàn.
              </Text>
            </View>
            <Switch
              value={isProPaid}
              onValueChange={setIsPro}
              trackColor={{ false: colors.border, true: colors.purple }}
              thumbColor={isProPaid ? colors.gold : '#ccc'}
            />
          </View>
        </Card>
      ) : null}

      <View style={{ height: 12 }} />
      <PrimaryButton title="Mua Pro (IAP)" onPress={onPurchase} variant="gold" />
      <View style={{ height: 8 }} />
      <PrimaryButton title="Khôi phục mua hàng" onPress={onRestore} variant="ghost" />

      <Text style={styles.envHint}>
        RevenueCat:{' '}
        {isRevenueCatConfigured() ? 'đã thấy API key env' : 'chưa cấu hình (TODO)'}
        {effectivePro && !isProPaid ? ' · đang Trial' : ''}
      </Text>

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.matrixTitle}>Pháp lý</Text>
        <Link href="/legal/privacy" style={styles.link}>
          Chính sách quyền riêng tư
        </Link>
        <Link href="/legal/terms" style={[styles.link, { marginTop: 8 }]}>
          Điều khoản sử dụng
        </Link>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.matrixTitle}>Hồ sơ</Text>
        {profile ? (
          <>
            <Text style={styles.profileLine}>Ngày sinh: {profile.birthDate}</Text>
            {profile.birthTime ? (
              <Text style={styles.profileLine}>Giờ sinh: {profile.birthTime}</Text>
            ) : null}
            {profile.birthPlace ? (
              <Text style={styles.profileLine}>Nơi sinh: {profile.birthPlace}</Text>
            ) : null}
            {traits.gender ? (
              <Text style={styles.profileLine}>Giới tính: {traits.gender}</Text>
            ) : null}
            {traits.career ? (
              <Text style={styles.profileLine}>Công việc: {traits.career}</Text>
            ) : null}
            {traits.relationshipStatus ? (
              <Text style={styles.profileLine}>Tình cảm: {traits.relationshipStatus}</Text>
            ) : null}
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="Xóa hồ sơ / onboarding lại"
              variant="ghost"
              onPress={() =>
                Alert.alert('Xóa hồ sơ?', 'Bạn sẽ nhập lại ngày sinh.', [
                  { text: 'Huỷ', style: 'cancel' },
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => clearProfile(),
                  },
                ])
              }
            />
          </>
        ) : (
          <Text style={styles.profileLine}>Chưa có hồ sơ</Text>
        )}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.matrixTitle}>Tài khoản</Text>
        <Text style={styles.profileLine}>
          {user?.email ?? '—'}
          {isDemoAuth ? ' · demo local (không trial cloud)' : ''}
        </Text>
        <Text style={styles.switchHint}>
          {supabaseConfigured
            ? 'Hồ sơ + traits đồng bộ Supabase. Trial chỉ qua RPC (client không ghi is_pro / trial_*). Free limits vẫn local.'
            : 'Chế độ demo: chưa có Supabase — không cấp trial Pro 7 ngày như production.'}
        </Text>
        <View style={{ height: 10 }} />
        <PrimaryButton
          title="Đăng xuất"
          variant="ghost"
          onPress={() =>
            Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để tiếp tục.', [
              { text: 'Huỷ', style: 'cancel' },
              {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: () => signOut(),
              },
            ])
          }
        />
      </Card>

      <View style={{ height: 14 }} />
      <DisclaimerBanner />
      <Text style={styles.legal}>{DISCLAIMER}</Text>
      <Text style={styles.legal}>
        Khi lên store: cấu hình AdMob & RevenueCat qua EAS secrets — không commit secret / service_role.
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textMuted, marginBottom: 16, marginTop: 4 },
  matrixTitle: { color: colors.gold, fontWeight: '700', marginBottom: 10, fontSize: 16 },
  rowHead: { flexDirection: 'row', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cell: {
    flex: 1,
    color: colors.text,
    fontSize: 11,
    textAlign: 'center',
  },
  head: { fontWeight: '700', color: colors.purpleSoft },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  switchHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  envHint: { color: colors.textMuted, fontSize: 12, marginTop: 10, textAlign: 'center' },
  profileLine: { color: colors.text, marginTop: 4 },
  link: { color: colors.gold, fontWeight: '700', fontSize: 15 },
  legal: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
});
