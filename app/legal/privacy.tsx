import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Chính sách quyền riêng tư' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Chính sách quyền riêng tư</Text>
        <Text style={styles.meta}>Van Su AI · Cập nhật: 13/09/2026</Text>

        <Section title="1. Phạm vi">
          Ứng dụng Van Su AI cung cấp nội dung giải trí về lịch vạn sự, tử vi và tướng số (có thể
          dùng ảnh chân dung do bạn chọn). Chính sách này mô tả dữ liệu chúng tôi xử lý khi bạn
          dùng app.
        </Section>

        <Section title="2. Dữ liệu thu thập">
          • Tài khoản: email và mật khẩu (xác thực qua Supabase Auth).{'\n'}
          • Hồ sơ: ngày sinh (bắt buộc), giờ/nơi sinh, tên gọi (tuỳ chọn).{'\n'}
          • Entitlement: trạng thái Pro đã mua / trial (trial_started_at, trial_ends_at,
          trial_consumed, is_pro).{'\n'}
          • Ảnh tướng số: xử lý trên thiết bị hoặc gửi tới nhà cung cấp AI nếu bạn kích hoạt tính
          năng và đã cấu hình API — không dùng để nhận dạng danh tính pháp lý.{'\n'}
          • Nhật ký kỹ thuật tối thiểu (lỗi, phiên) để ổn định dịch vụ.
        </Section>

        <Section title="3. Mục đích sử dụng">
          Cung cấp lịch/tử vi/chat cá nhân hóa giải trí; quản lý gói Free / Trial / Pro; bảo mật
          tài khoản; tuân thủ yêu cầu cửa hàng ứng dụng.
        </Section>

        <Section title="4. Cơ sở pháp lý / đồng ý">
          Bằng việc tạo tài khoản và dùng app, bạn đồng ý xử lý dữ liệu theo chính sách này. Bạn có
          thể xóa hồ sơ trong app hoặc yêu cầu xóa tài khoản qua hỗ trợ.
        </Section>

        <Section title="5. Bên thứ ba">
          • Supabase (auth + database) — chỉ dùng anon key trên client; không nhúng service_role.
          {'\n'}
          • RevenueCat / cửa hàng (IAP) khi bật mua Pro.{'\n'}
          • AdMob (quảng cáo) trên gói Free khi cấu hình.{'\n'}
          • Nhà cung cấp AI (Workers AI / OpenAI hoặc tương đương) nếu EXPO_PUBLIC_AI_API_URL được
          cấu hình — nội dung gửi đi có thể gồm hồ sơ sinh và câu hỏi chat.
        </Section>

        <Section title="6. Lưu trữ & bảo mật">
          Dữ liệu hồ sơ lưu trên Supabase theo RLS (mỗi user chỉ đọc/sửa row của mình). Giới hạn
          Free (số lần dùng) hiện lưu local trên thiết bị. Chúng tôi không bán dữ liệu cá nhân.
        </Section>

        <Section title="7. Trẻ em">
          App không dành cho trẻ em dưới 13 tuổi (hoặc độ tuổi tối thiểu theo khu vực). Không phân
          tích tướng số / nội dung AI nhắm vào trẻ vị thành niên.
        </Section>

        <Section title="8. Liên hệ">
          Câu hỏi về quyền riêng tư: liên hệ chủ sở hữu dự án qua kênh hỗ trợ ghi trên trang store
          (Dat / datntpro).
        </Section>

        <Text style={styles.footer}>
          Nội dung AI và luận giải chỉ mang tính giải trí, không phải tư vấn y tế, pháp lý, tài
          chính hay tâm linh chuyên môn.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  section: { marginBottom: 16 },
  h2: { color: colors.gold, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  body: { color: colors.text, lineHeight: 22, fontSize: 14 },
  footer: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
