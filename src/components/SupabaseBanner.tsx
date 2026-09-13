import { StyleSheet, Text, View } from 'react-native';

import { isSupabaseConfigured } from '@/src/lib/supabase';
import { colors } from '@/src/theme/colors';

/** Shown when EXPO_PUBLIC_SUPABASE_* env is missing — demo/offline mode. */
export function SupabaseBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>Chưa cấu hình Supabase</Text>
      <Text style={styles.hint}>
        Demo local: đăng nhập/đăng ký lưu trên máy. Thêm URL + anon key vào .env để dùng cloud.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#3B2A0A',
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    color: colors.warning,
    fontWeight: '800',
    fontSize: 13,
  },
  hint: {
    color: colors.goldSoft,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
