# Home screen widgets — Van Su AI

> Widget lịch ngày dạng **bảng compact** (không hiện disclaimer trên widget — xem Điều khoản trong app).

## Android (ưu tiên) — `react-native-android-widget`

| Mục | Chi tiết |
|-----|----------|
| Thư viện | `react-native-android-widget` (Expo config plugin) |
| Widget name | `VanSuDay` |
| Entry | `index.ts` đăng ký `registerWidgetTaskHandler` rồi `expo-router/entry` |
| UI | `src/widgets/VanSuDayWidget.tsx` — layout bảng (FlexWidget rows) |
| Data | `loadWidgetFortune` đọc `user:profile` + `user:traits` từ AsyncStorage |
| Tap | Deep link `vansuai://day/YYYY-MM-DD` → mở app / chọn ngày |
| Refresh | `syncHomeWidget` từ tab Hôm nay + `updatePeriodMillis` 30 phút |

### Screenshot / layout mô tả

```
┌─────────────────────────────┐
│ Van Su AI                   │
│ Dương          20/09/2026   │
│ Âm             10/8 Bính Ngọ│
│ Can chi        Đinh Dậu     │
│ Chất ngày      Ngày tốt     │
│ Tuổi Thân hợp Dậu · 30 tuổi │  ← 1 dòng cá nhân hóa ngắn
└─────────────────────────────┘
```

Không có dòng “chỉ mang tính giải trí” trên widget. Cần **rebuild APK** (native widget) sau khi đổi UI.

### Cần native rebuild (không chạy trên Expo Go)

Widget là **native module** + provider trong `AndroidManifest`. Sau khi thêm plugin / đổi widget UI:

```bash
npm install
npx expo prebuild -p android --clean
cd android && ./gradlew assembleDebug
# Artifact: android/app/build/outputs/apk/debug/app-debug.apk
# Hoặc: npx expo run:android
```

Gắn widget: long-press home → Widgets → **Van Su AI · Hôm nay**.

EAS: `eas build -p android --profile preview` (native build, không phải Expo Go).

### Giới hạn Free/Pro

Widget chỉ đọc lịch đã tính local — **không** bypass limit tử vi/chat. Không dùng `service_role`.

## iOS (khả thi nhưng chưa ship native)

Expo SDK 57 **chưa** có widget home-screen first-party ổn định như Android plugin trên. Đường đi P1:

1. EAS + custom native code / WidgetKit extension (`ios/VanSuWidget`).
2. Shared App Group + UserDefaults để đồng bộ tóm tắt từ JS.
3. Deep link `vansuai://day/YYYY-MM-DD` (scheme đã có trong `app.json`).

Scaffold JS đã dùng chung `getPersonalizedDayFortune` — khi thêm WidgetKit chỉ cần bridge payload `{ solar, lunar, quality, widgetSummary }`.

## Deep link

| URI | Hành vi |
|-----|---------|
| `vansuai://day/2026-09-20` | Mở app, chọn ngày 20/09/2026 trên lịch |
| `vansuai://auth/callback` | Auth (đã có) |

## Checklist QA widget Android

1. [ ] `prebuild` + `assembleDebug` thành công  
2. [ ] Gắn widget hiện bảng Dương | Âm | Can chi | Chất ngày + 1 dòng cá nhân  
3. [ ] **Không** hiện disclaimer trên widget  
4. [ ] Có `birthDate` → summary khác user khác ngày  
5. [ ] Tap widget → mở app (ngày tương ứng)  
6. [ ] Đổi ngày sinh trong app → mở lại / chờ update → widget đổi tóm tắt  
