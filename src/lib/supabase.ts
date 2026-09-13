import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { EntitlementSource } from '@/src/lib/entitlement';

/**
 * Public Expo env only — never put service_role in EXPO_PUBLIC_*.
 * When either value is missing, the app runs in demo/offline mode
 * (auth screens still show; session is mocked locally).
 */
const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export type ProfileRow = {
  id: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  display_name: string | null;
  /** Paid Pro only — never true solely because of trial. */
  is_pro: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_consumed: boolean;
  entitlement_source: EntitlementSource;
  created_at: string;
  updated_at: string;
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** Translate common Supabase auth errors to Vietnamese. */
export function authErrorVi(message: string | undefined | null): string {
  const m = (message ?? '').toLowerCase();
  if (!m) return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  if (m.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
  if (m.includes('email not confirmed'))
    return 'Email chưa được xác nhận. Kiểm tra hộp thư (kể cả spam) rồi đăng nhập lại.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Email này đã được đăng ký.';
  if (m.includes('password') && m.includes('least'))
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return 'Định dạng email không hợp lệ.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối mạng. Kiểm tra kết nối rồi thử lại.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Thao tác quá nhiều lần. Vui lòng đợi rồi thử lại.';
  if (m.includes('session') || m.includes('refresh') || m.includes('jwt'))
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  return message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
