# Van Su AI

Ứng dụng giải trí lịch vạn sự / tử vi / tướng số bằng tiếng Việt, xây bằng **Expo + React Native + TypeScript + Expo Router**.

> **Chỉ mang tính giải trí, không phải lời khuyên chuyên môn.**

## Chạy dự án

```bash
cd van-su-ai
npm install
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

### Tabs
- **Hôm nay** — dương lịch + âm lịch, ngày tốt/xấu (heuristic), giờ hoàng đạo, vào Chat AI
- **Tử vi** — luận giải ngày từ hồ sơ (template VI; optional `EXPO_PUBLIC_MOCK_AI_URL`)
- **Tướng số** — chọn ảnh (`expo-image-picker`) → văn bản phân tích mock
- **Pro / Cài đặt** — bảng Free vs Pro, disclaimer, bật Pro demo local

### Onboarding
Modal bắt buộc **ngày sinh**; giờ/nơi sinh tuỳ chọn → lưu `AsyncStorage`.

### Free vs Pro

| | Free | Pro |
|--|------|-----|
| Tử vi | 1 lần/ngày | Không giới hạn |
| Tướng số | 1 lần/tuần | Không giới hạn |
| Chat AI | 5 tin/ngày | Không giới hạn |
| Quảng cáo | Placeholder | Ẩn |
| Mở khóa | — | Toggle local `isPro` |

Pro thật (IAP) chưa gắn — xem placeholder RevenueCat.

## Env

Copy `.env.example` → `.env` (tuỳ chọn):

```bash
EXPO_PUBLIC_MOCK_AI_URL=
EXPO_PUBLIC_ADMOB_BANNER_ID=
EXPO_PUBLIC_REVENUECAT_API_KEY=
```

**Không commit secret.** Dùng EAS Secrets khi build store.

## Cấu trúc chính

```
app/                  # Expo Router (tabs + chat modal)
src/lib/calendar.ts   # Dương ↔ âm, can chi, giờ hoàng đạo
src/lib/limits.ts     # Giới hạn Free (AsyncStorage)
src/lib/horoscope.ts  # Template tử vi
src/services/admob.ts # TODO AdMob
src/services/revenuecat.ts # TODO IAP
__tests__/calendar.test.ts
scripts/assert-calendar.mjs
```

## Store / pháp lý (ghi chú)

- Hiển thị disclaimer trên onboarding, tab nội dung và màn Pro.
- Trước khi lên App Store / Play Store: Privacy Policy, Terms, age rating, cấu hình AdMob & IAP thật, bỏ toggle demo nếu cần.
- Nội dung AI/mock **không** thay thế tư vấn y tế, pháp lý, tài chính.

## Tech

- Expo SDK 57 (latest stable tại thời điểm scaffold)
- Expo Router tabs
- AsyncStorage, DateTimePicker, ImagePicker
