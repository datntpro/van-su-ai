# Van Su AI

Ứng dụng giải trí lịch vạn sự / tử vi / tướng số bằng tiếng Việt — **Expo + React Native + TypeScript + Expo Router**.

> **Chỉ mang tính giải trí, không phải lời khuyên chuyên môn.**

## Chạy dự án

```bash
cd van-su-ai
npm install
cp .env.example .env   # Supabase URL + anon key (bắt buộc cho trial cloud)
npx expo start
```

### Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm start` | `expo start` |
| `npm test` | Jest (lịch âm + entitlement) |
| `npm run test:calendar` | Assert ngày cố định |

## Free / Trial 7 ngày / Pro

| Tính năng | Free | Trial 7 ngày | Pro (paid) |
|-----------|------|--------------|------------|
| Lịch vạn sự hôm nay | ✓ | ✓ | ✓ |
| Tử vi ngày | 1/ngày | Unlimited | Unlimited |
| Tướng số ảnh | 1/tuần | Unlimited | Unlimited |
| Chat AI | 5 tin/ngày | Unlimited | Unlimited |
| Quảng cáo | Có (placeholder) | **Không** | **Không** |
| Countdown trial | — | ✓ | — |
| IAP / Restore | CTA | Soft CTA D5–6 | Active |
| Demo toggle `isPro` | **Chỉ `__DEV__`** | **Chỉ `__DEV__`** | **Ẩn store** |

**Entitlement:** `effectivePro = is_pro (paid) OR (trial_consumed && now < trial_ends_at)`.  
`profiles.is_pro` = **paid only** — không set true vì trial.

**Access flow (locked):** tạo tài khoản **Free** → onboarding ngày sinh → **sau đó** RPC `start_trial_if_eligible` cấp Trial Pro 7 ngày. **Không** cấp trial trước đăng ký. Demo/offline **không** cấp trial cloud.

**RLS / entitlement:** client (anon JWT) **không** được `UPDATE` `is_pro`, `trial_started_at`, `trial_ends_at`, `trial_consumed`, `entitlement_source`. Chỉ RPC security definer / `service_role`. Nếu RPC fail → hiện lỗi, **không** fallback ghi trial từ app.

Chi tiết BA: `docs/BA-FEATURE-GAP.md` · Checklist pilot: `docs/PILOT-CHECKLIST.md`.

## Auth (Supabase)

- Đăng nhập / Đăng ký email; messaging xác nhận email; `refreshSession`
- Hồ sơ + trial fields trên `profiles` (RLS own-row; entitlement columns **read-only** cho client)
- `user_traits` — hồ sơ AI cá nhân (giới tính, hôn nhân, nghề, quan tâm, JSONB questionnaire)
- `horoscope_chats` — hội thoại tử vi (own-only)
- Free usage counters: AsyncStorage (local)
- Demo mode nếu thiếu env: banner vàng; **không** hứa trial 7 ngày production

## Tabs & AI

- **Hôm nay** — lịch + Trial banner / soft nudge D5–6 + ads nếu Free
- **Tử vi** — hội thoại nhiều lượt: AI hỏi giờ sinh / giới tính / hôn nhân / việc / quan tâm / mục tiêu; lưu `user_traits`; rồi luận giải cá nhân. Bỏ qua = gen ngay. Persist `horoscope_chats`.
- **Chat** — pluggable AI: nếu `EXPO_PUBLIC_AI_API_URL` + `EXPO_PUBLIC_AI_API_KEY` → HTTP; else mock + badge **MOCK AI** trong `__DEV__`
- **Tướng số** — ảnh → mock analysis (P1: vision API)
- **Pro** — matrix Free/Trial/Pro, status trial, IAP stub, legal links
- Legal: `app/legal/privacy.tsx`, `app/legal/terms.tsx`

Worker stub (optional): `worker/` — proxy Workers AI / OpenAI, contract JSON documented.

## Supabase — checklist nhanh

1. Email auth bật (Confirm email: tắt khi dogfood nhanh / bật khi pilot gần store).
2. Chạy migrations:
   - `20260913000000_profiles.sql`
   - `20260913120000_trial_entitlement.sql` (trial columns + RPC `start_trial_if_eligible`)
   - `20260913140000_rls_entitlement_traits_chats.sql` (lock entitlement columns + `user_traits` + `horoscope_chats`)
3. Chỉ **anon** key trong Expo — **never service_role**.
4. Store build: `EXPO_PUBLIC_STORE_BUILD=1` + bắt buộc Supabase env (tắt demo).

Xem đầy đủ: `docs/PILOT-CHECKLIST.md`.

## Env

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STORE_BUILD=1
EXPO_PUBLIC_AI_API_URL=
EXPO_PUBLIC_AI_API_KEY=
EXPO_PUBLIC_MOCK_AI_URL=
EXPO_PUBLIC_ADMOB_BANNER_ID=
EXPO_PUBLIC_REVENUECAT_API_KEY=
```

**Không commit secret.** EAS Secrets cho store. RevenueCat / AdMob: xem comment trong `src/services/revenuecat.ts`, `src/services/admob.ts`.

## Cấu trúc chính

```
app/(auth)/            # Login / Register (+ legal links)
app/(tabs)/            # Hôm nay, Tử vi, Tướng số, Pro
app/legal/             # Privacy + Terms (VI)
app/chat.tsx           # Chat AI modal
src/lib/entitlement.ts # effectivePro / trial math
src/lib/ai.ts          # Pluggable AI client
src/lib/profileSync.ts # profiles + RPC-only trial + traits
src/lib/traits.ts      # user_traits helpers
src/lib/horoscopeConversation.ts
src/services/revenuecat.ts  # configure + syncPaidProFromCustomerInfo hooks
worker/                # Optional CF Worker AI proxy
supabase/migrations/   # profiles + trial + RLS lock + traits/chats
docs/PILOT-CHECKLIST.md
```

## Tech

Expo SDK 57 · Expo Router · Supabase Auth + RLS · AsyncStorage · Jest

## Responsive UI (bar phones + foldables)

Layout uses `useWindowDimensions` + safe-area insets (`src/hooks/useWindowLayout.ts`, `src/components/Screen.tsx`):

| Width | Example | Behavior |
|-------|---------|----------|
| ~320px | Galaxy Fold **cover** / very narrow | Narrow gutters (12), smaller titles, single column, chips ~50% width |
| ~360–480 | Typical bar phone | Default gutters (16), single column, content fluid |
| ≥700px | Fold **open** / large | Centered column max ~560–640, optional **2-column** on Hôm nay (summary + giờ hoàng đạo) |

Rules:
- Prefer **flex + %** — avoid hard-coded page widths that break on hinge resize
- Sheets (onboarding / paywall) use `maxWidth` + `alignSelf: 'center'`
- Tab bar / composer respect bottom safe area

### Manual QA widths

Jest covers `computeWindowLayout` for 320 / 360 / 720 / 900 (`__tests__/layout.test.ts`). On device or Expo web, resize or use Fold open/cover:

```bash
npm test -- layout.test.ts
```

## Android APK (pilot / debug)

Debug APK is enough for dogfood — **no production keystore required**.

```bash
# 1) Env placeholders (Supabase can be filled later)
cp .env.example .env

# 2) Native project
npx expo prebuild -p android --no-install

# 3) Assemble debug
cd android && ./gradlew assembleDebug

# Artifact typically:
# android/app/build/outputs/apk/debug/app-debug.apk
# Copied for convenience to: van-su-ai-debug.apk (repo root) when built on CI/box
```

Install on a device:

```bash
adb install -r van-su-ai-debug.apk
# or copy the APK to the phone and open it (enable Install unknown apps)
```

EAS alternative (if logged in): `eas build -p android --profile preview --local`
