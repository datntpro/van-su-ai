# Van Su AI — Pilot checklist (Dat)

**Mục tiêu:** TestFlight / internal dogfood với Trial Pro 7 ngày + entitlement + legal + AI pluggable.

## 1. Supabase

- [ ] Project tạo xong; Email provider bật
- [ ] Chạy SQL theo thứ tự:
  1. `supabase/migrations/20260913000000_profiles.sql`
  2. `supabase/migrations/20260913120000_trial_entitlement.sql`
  3. `supabase/migrations/20260913140000_rls_entitlement_traits_chats.sql`
- [ ] Table Editor → `profiles` có cột: `trial_started_at`, `trial_ends_at`, `trial_consumed`, `entitlement_source`, `is_pro`
- [ ] Table Editor → `user_traits`, `horoscope_chats`
- [ ] RPC `start_trial_if_eligible` tồn tại (Authenticated execute)
- [ ] RPC `apply_paid_pro` **không** grant authenticated (service_role only)
- [ ] Client `UPDATE profiles.is_pro` bị chặn (GRANT + trigger)
- [ ] `.env`: chỉ `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (**không** service_role)
- [ ] Dev: có thể tắt “Confirm email” để vào app ngay; Pilot/store: bật confirm + copy messaging đã có trên Register

## 2. Env pilot / store

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_STORE_BUILD=1          # ẩn demo Pro toggle
# Optional AI:
EXPO_PUBLIC_AI_API_URL=https://...
EXPO_PUBLIC_AI_API_KEY=shared-bearer
# Optional IAP / ads placeholders:
EXPO_PUBLIC_REVENUECAT_API_KEY=...
EXPO_PUBLIC_ADMOB_BANNER_ID=...
```

- [ ] Store / EAS: `EXPO_PUBLIC_STORE_BUILD=1`
- [ ] Disable demo: luôn set Supabase env trên build store (không ship offline auth)

## 3. Trial AC (US-T1 … T5)

| ID | Kiểm tra |
|----|----------|
| US-T1 | Đăng ký cloud → onboarding ngày sinh → `trial_consumed=true`, `trial_ends_at ≈ now+7d`; đăng ký lại cùng user không trial mới; demo auth không ghi trial; banner “Pro dùng thử · 7 ngày” |
| US-T2 | Trong trial: unlimited tử vi/tướng số/chat; ads ẩn; Pro tab countdown; không cộng Free counters |
| US-T3 | Sau `trial_ends_at`: effectivePro=false; modal hết trial 1 lần; ads hiện lại; mua Pro → paid thắng |
| US-T4 | Clear app data + login lại → không trial mới; store build không flip `is_pro` từ UI; restore không gia hạn trial |
| US-T5 | Free hit limit → PaywallSheet (remaining + CTA Pro + disclaimer) |

### Access flow (locked)

```
Đăng ký Free (email) → Onboarding ngày sinh → RPC start_trial_if_eligible
```

Không cấp trial trước registration. `handle_new_user` chỉ insert profile trống.

### Cách test nhanh trial + RLS + tử vi

1. Tài khoản mới + confirm (nếu bật) + login. Row `profiles`: `is_pro=false`, `trial_consumed=false` (Free, chưa trial).
2. Nhập ngày sinh → RPC trial: `trial_consumed=true`, `trial_ends_at ≈ now+7d`; banner trial trên Hôm nay / tab Pro.
3. SQL Editor (anon không được): thử `update profiles set is_pro = true where id = auth.uid()` bằng JWT user → **fail** (`entitlement columns are read-only` / permission denied).
4. Tab Tử vi: AI hỏi thêm (giờ sinh, giới tính…); trả lời → `user_traits` + `horoscope_chats` có row. Bỏ qua → vẫn ra luận giải.
5. Tạo tử vi nhiều lần trong trial — không bị limit.
6. (Optional) SQL **service_role**: `update profiles set trial_ends_at = now() - interval '1 minute' where id = '…'` → reload → modal hết trial + Free limits + ads.
7. Build với `STORE_BUILD=1` hoặc release: không thấy switch “Mở khóa Pro (demo)”.

## 4. Legal / AI / Auth

- [ ] In-app: `/legal/privacy`, `/legal/terms` từ Pro + Register
- [ ] AI: không URL → mock + badge MOCK AI trong `__DEV__`; có URL+key → POST contract (xem `worker/`)
- [ ] Disclaimer trên mọi reply AI
- [ ] Auth: messaging confirm email; `refreshSession` sẵn; lỗi VI

## 5. Out of scope P0 (đừng block pilot)

Full lịch Việt sâu, AdMob production live IDs, widget, phong thủy, RC purchase thật trên device (stub OK nếu chưa gắn SDK).

## 6. Git / build

```bash
npm install
npm test
npx expo start
# EAS: set secrets + EXPO_PUBLIC_STORE_BUILD=1
```
