# Van Su AI

Ứng dụng giải trí lịch vạn sự / tử vi / tướng số bằng tiếng Việt, xây bằng **Expo + React Native + TypeScript + Expo Router**.

> **Chỉ mang tính giải trí, không phải lời khuyên chuyên môn.**

## Chạy dự án

```bash
cd van-su-ai
npm install
cp .env.example .env   # điền Supabase URL + anon key (tuỳ chọn)
npx expo start
# hoặc: npm start
```

Quét QR bằng app **Expo Go**, hoặc nhấn `a` (Android) / `i` (iOS simulator) / `w` (web).

### Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm start` | `expo start` |
| `npm test` | Jest unit tests (lịch âm) |
| `npm run test:calendar` | Script Node assert ngày cố định `2026-09-13` |

## Tính năng MVP

### Auth (Supabase)
- Màn **Đăng nhập** / **Đăng ký** (email + mật khẩu) trước khi vào tabs
- Hồ sơ `profiles` trên cloud (ngày/giờ/nơi sinh, `is_pro`)
- Giới hạn Free (tử vi/ngày, tướng số/tuần, chat/ngày) **vẫn lưu local** (`AsyncStorage`) — chưa sync usage lên cloud
- **Demo mode**: nếu thiếu `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, app hiện banner **"Chưa cấu hình Supabase"** và auth chạy mock trên máy (không gọi API)

### Tabs
- **Hôm nay** — dương lịch + âm lịch, ngày tốt/xấu (heuristic), giờ hoàng đạo, vào Chat AI
- **Tử vi** — luận giải ngày từ hồ sơ (template VI; optional `EXPO_PUBLIC_MOCK_AI_URL`)
- **Tướng số** — chọn ảnh (`expo-image-picker`) → văn bản phân tích mock
- **Pro / Cài đặt** — bảng Free vs Pro, disclaimer, bật Pro demo, **Đăng xuất**

### Onboarding
Modal bắt buộc **ngày sinh**; giờ/nơi sinh tuỳ chọn → lưu `AsyncStorage` và **đồng bộ lên Supabase `profiles`** khi đã đăng nhập cloud.

### Free vs Pro

| | Free | Pro |
|--|------|-----|
| Tử vi | 1 lần/ngày | Không giới hạn |
| Tướng số | 1 lần/tuần | Không giới hạn |
| Chat AI | 5 tin/ngày | Không giới hạn |
| Quảng cáo | Placeholder | Ẩn |
| Mở khóa | — | Toggle local `isPro` (+ sync `profiles.is_pro` nếu có cloud) |

Pro thật (IAP) chưa gắn — xem placeholder RevenueCat.

## Supabase — checklist cho Dat

Làm **một lần** trên [Supabase Dashboard](https://supabase.com/dashboard):

1. **Tạo project** (region gần VN nếu muốn, vd. Singapore).
2. **Authentication → Providers → Email**: bật Email. Tuỳ chọn tắt “Confirm email” khi đang dev (để đăng ký vào app ngay).
3. **Project Settings → API**:
   - Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - Copy **anon / public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **Không** dùng `service_role` trong app Expo / bất kỳ biến `EXPO_PUBLIC_*` nào.
4. **SQL Editor**: chạy toàn bộ file  
   `supabase/migrations/20260913000000_profiles.sql`  
   (tạo bảng `profiles`, RLS, trigger tạo profile khi signup).
5. Copy `.env.example` → `.env`, dán URL + anon key, restart `npx expo start`.
6. Kiểm tra: Đăng ký → vào tabs → onboarding → xem row trong **Table Editor → profiles**.

### Demo / offline (không có env)

- Auth screens vẫn bắt buộc.
- Đăng nhập/đăng ký tạo session **local** (AsyncStorage).
- Banner vàng: **Chưa cấu hình Supabase**.
- Hồ sơ & Free limits chỉ trên thiết bị.

## Env

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MOCK_AI_URL=
EXPO_PUBLIC_ADMOB_BANNER_ID=
EXPO_PUBLIC_REVENUECAT_API_KEY=
```

**Không commit secret.** Dùng EAS Secrets khi build store. Chỉ anon/publishable key trong client.

## Cấu trúc chính

```
app/(auth)/           # Đăng nhập / Đăng ký
app/(tabs)/           # Tabs + chat modal
src/context/          # AuthContext + AppContext
src/lib/supabase.ts   # Client + demo-mode helpers
src/lib/profileSync.ts# Merge AsyncStorage ↔ profiles
supabase/migrations/  # SQL cho cloud DB
src/lib/calendar.ts   # Dương ↔ âm, can chi, giờ hoàng đạo
src/lib/limits.ts     # Giới hạn Free (AsyncStorage — local)
src/services/admob.ts # TODO AdMob
src/services/revenuecat.ts # TODO IAP
```

## Store / pháp lý (ghi chú)

- Hiển thị disclaimer trên onboarding, tab nội dung và màn Pro.
- Trước khi lên App Store / Play Store: Privacy Policy, Terms, age rating, cấu hình AdMob & IAP thật, bỏ toggle demo nếu cần.
- Nội dung AI/mock **không** thay thế tư vấn y tế, pháp lý, tài chính.

## Tech

- Expo SDK 57
- Expo Router (auth stack + tabs)
- Supabase Auth (`@supabase/supabase-js`) + RLS profiles
- AsyncStorage, DateTimePicker, ImagePicker
