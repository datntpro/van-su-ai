# Home screen widgets — Van Su AI

> **Chỉ mang tính giải trí.** Widget hiển thị dương/âm, chất lượng ngày, tóm tắt cá nhân hóa ngắn.

## Android (ưu tiên) — `react-native-android-widget`

| Mục | Chi tiết |
|-----|----------|
| Thư viện | `react-native-android-widget` (Expo config plugin) |
| Widget name | `VanSuDay` |
| Entry | `index.ts` đăng ký `registerWidgetTaskHandler` rồi `expo-router/entry` |
| UI | `src/widgets/VanSuDayWidget.tsx` (FlexWidget / TextWidget) |
| Data | `loadWidgetFortune` đọc `user:profile` + `user:traits` từ AsyncStorage |
| Tap | Deep link `vansuai://day/YYYY-MM-DD` → mở app / chọn ngày |
| Refresh | `syncHomeWidget` từ tab Hôm nay + `updatePeriodMillis` 30 phút |

### Cần native rebuild (không chạy trên Expo Go)

Widget là **native module** + provider trong `AndroidManifest`. Sau khi thêm plugin:

```bash
# 1) Cài deps (đã có trong package.json)
npm install

# 2) Sinh lại native project (plugin ghi widget provider)
npx expo prebuild -p android --clean

# 3) Build debug APK
cd android && ./gradlew assembleDebug
# Artifact: android/app/build/outputs/apk/debug/app-debug.apk

# Hoặc:
npx expo run:android
```

Gắn widget: long-press home → Widgets → **Van Su AI · Hôm nay**.

EAS: `eas build -p android --profile preview` (profile có `developmentClient` hoặc production đều được miễn là native build, không phải Expo Go).

### Giới hạn Free/Pro

Widget chỉ đọc lịch đã tính local — **không** bypass limit tử vi/chat. Không dùng `service_role`.

## iOS (khả thi nhưng chưa ship native)

Expo SDK 57 **chưa** có widget home-screen first-party ổn định như Android plugin trên. Đường đi P1:

1. EAS + custom native code / WidgetKit extension (`ios/VanSuWidget`).
2. Shared App Group + UserDefaults để đồng bộ tóm tắt từ JS (AsyncStorage → native bridge).
3. Deep link `vansuai://day/YYYY-MM-DD` (scheme đã có trong `app.json`).

Scaffold JS đã dùng chung `getPersonalizedDayFortune` — khi thêm WidgetKit chỉ cần bridge payload `{ solar, lunar, quality, widgetSummary }`.

Cho đến khi có extension: iOS users mở tab **Hôm nay** (lưới tháng đầy đủ).

## Deep link

| URI | Hành vi |
|-----|---------|
| `vansuai://day/2026-09-20` | Mở app, chọn ngày 20/09/2026 trên lịch |
| `vansuai://auth/callback` | Auth (đã có) |

## Checklist QA widget Android

1. [ ] `prebuild` + `assembleDebug` thành công  
2. [ ] Gắn widget hiện dương + âm + label chất lượng  
3. [ ] Có `birthDate` → summary khác user khác ngày  
4. [ ] Tap widget → mở app (ngày tương ứng)  
5. [ ] Đổi ngày sinh trong app → mở lại / chờ update → widget đổi tóm tắt  
