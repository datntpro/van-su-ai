import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function TermsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Điều khoản sử dụng' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Điều khoản sử dụng</Text>
        <Text style={styles.meta}>Van Su AI · Cập nhật: 13/09/2026</Text>

        <Section title="1. Chấp nhận điều khoản">
          Khi tải, đăng ký hoặc sử dụng Van Su AI, bạn đồng ý với Điều khoản này và Chính sách
          quyền riêng tư. Nếu không đồng ý, hãy ngừng sử dụng ứng dụng.
        </Section>

        <Section title="2. Tính chất giải trí">
          Mọi nội dung lịch vạn sự, tử vi, tướng số, chat AI chỉ mang tính giải trí. Không phải lời
          khuyên chuyên môn về y tế, pháp lý, tài chính, đầu tư hay tâm linh. Không đưa quyết định
          quan trọng chỉ dựa trên kết quả trong app.
        </Section>

        <Section title="3. Tài khoản">
          Bạn chịu trách nhiệm bảo mật mật khẩu và hoạt động trên tài khoản. Không chia sẻ tài
          khoản. Chúng tôi có thể tạm khóa tài khoản nếu phát hiện lạm dụng (ví dụ tạo hàng loạt
          email để lấy trial).
        </Section>

        <Section title="4. Gói Free, Trial Pro 7 ngày, Pro">
          • Free: có giới hạn số lần tử vi/ngày, tướng số/tuần, chat/ngày; có thể hiện quảng cáo.
          {'\n'}
          • Trial Pro 7 ngày: cấp một lần sau đăng ký cloud + hoàn tất ngày sinh (Option A); không
          áp dụng demo/offline auth; không gia hạn bằng restore purchases.{'\n'}
          • Pro (trả phí): qua In-App Purchase / RevenueCat khi đã cấu hình; quyền lợi không giới
          hạn theo bảng so sánh trong app.
        </Section>

        <Section title="5. Ảnh & AI">
          Bạn chỉ tải ảnh bạn có quyền sử dụng. Không dùng ảnh trẻ em / nội dung nhạy cảm. Kết quả
          AI có thể sai hoặc mang tính khuôn mẫu; nhà phát hành không chịu trách nhiệm thiệt hại
          phát sinh từ việc tin tưởng nội dung AI.
        </Section>

        <Section title="6. Sở hữu trí tuệ">
          Thương hiệu, giao diện và nội dung gốc thuộc chủ sở hữu Van Su AI. Không sao chép trái
          phép.
        </Section>

        <Section title="7. Giới hạn trách nhiệm">
          App được cung cấp “nguyên trạng”. Trong phạm vi pháp luật cho phép, chúng tôi không chịu
          trách nhiệm thiệt hại gián tiếp, mất dữ liệu hoặc mất lợi nhuận phát sinh từ việc sử
          dụng.
        </Section>

        <Section title="8. Thay đổi">
          Điều khoản có thể được cập nhật; phiên bản mới hiển thị trong app / repo. Việc tiếp tục
          sử dụng sau cập nhật đồng nghĩa chấp nhận thay đổi.
        </Section>

        <Section title="9. Liên hệ">
          Hỗ trợ: kênh liên hệ trên trang store hoặc repository datntpro/van-su-ai.
        </Section>

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
});
