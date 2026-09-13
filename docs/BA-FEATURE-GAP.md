# Van Su AI — BA Feature Gap + Trial Pro 7 ngày
**Author:** Business Analysis (BA) · **Date:** 2026-09-13  
**Repo:** `datntpro/van-su-ai` (Expo iOS/Android, UI VI, entertainment)  
**Yêu cầu Dat (bắt buộc):** Free có **trial Pro 7 ngày** → hết hạn về Free + ads/limits  
**SoT code hiện tại:** README + `src/lib/limits.ts` + `profiles.is_pro` (chưa có trial fields)

---

## 0. Tóm tắt verdict

| Hạng mục | Đánh giá |
|----------|----------|
| MVP lõi (tabs + auth + limits local + disclaimer) | Đủ **dogfood / TestFlight nội bộ** |
| Ship store có thu tiền | **Chưa** — IAP/RevenueCat placeholder, AI mock, usage chỉ local, **chưa trial 7 ngày** |
| Cạnh tranh lịch/tử vi VN (vd. Lịch Việt) | Gap lớn về **độ sâu lịch** (chọn ngày đại sự, tiết khí, widget) và **lá số/năm**; USP hiện tại = **AI chat + tướng số ảnh** (cần thật + legal rõ) |

**Đề xuất ship gate:** P0 dưới đây xong (trial + entitlement server-ish + IAP thật hoặc soft-launch không IAP + AI tối thiểu 1 surface + legal store) rồi mới public.

---

## 1. Hiện trạng MVP (as-is)

### 1.1 Journey
```
Đăng ký/Đăng nhập (email) → Onboarding ngày sinh (bắt buộc) + giờ/nơi optional
  → Tabs: Hôm nay | Tử vi | Tướng số | Pro/Cài đặt
  → Chat AI (modal từ Hôm nay)
```

### 1.2 Free / Pro as-coded (`FREE_LIMITS`)

| Feature | Free | Pro (`isPro`) |
|---------|------|----------------|
| Lịch vạn sự hôm nay | ✓ | ✓ |
| Tử vi ngày | **1/ngày** | Unlimited |
| Tướng số ảnh | **1/tuần** | Unlimited |
| Chat AI | **5 tin/ngày** | Unlimited |
| Ads | Placeholder | Ẩn |
| Unlock | — | Toggle local + sync `profiles.is_pro` |

- Usage counters: **AsyncStorage only** (không sync cloud — comment migration thừa nhận multi-device gaming).
- Pro thật: RevenueCat / AdMob = **TODO**.
- AI tử vi / tướng số / chat: **mock/template** (+ optional `EXPO_PUBLIC_MOCK_AI_URL`).
- Disclaimer giải trí: có (onboarding, nội dung, Pro).

### 1.3 Schema thiếu cho trial
`profiles`: `birth_*`, `is_pro` — **không có** `trial_started_at`, `trial_ends_at`, `trial_used`, `entitlement_source`.

---

## 2. Gap vs sản phẩm tử vi / lịch VN cạnh tranh

**Đối thủ tham chiếu:** Lịch Việt / Lịch Vạn Niên (freemium: lịch sâu, chọn ngày tốt, tử vi năm/tháng, phong thủy, thần số học, Premium bỏ ads / unlock sâu; trial app-native ít — hay promo partner).

| Nhu cầu user VN | Đối thủ mạnh | Van Su AI MVP | Gap |
|-----------------|--------------|---------------|-----|
| Xem âm hôm nay, can chi, giờ hoàng đạo | ✓ sâu | ✓ heuristic cơ bản | P1: tiết khí, lễ, độ chính xác lịch |
| Chọn ngày tốt theo việc (cưới, khai trương…) | ✓ 50+ việc | ✗ | **P1** core lịch nếu muốn “vạn sự” thật |
| Tử vi ngày / tháng / năm / lá số | ✓ | Chỉ **ngày** + template | **P0 nội dung** hoặc hạ claim |
| Cá nhân hóa theo giờ/nơi sinh | ✓ | Onboarding có; luận giải nông | P1 khi AI thật |
| Tướng số / xem tướng ảnh | Ít hơn | ✓ tab + mock | USP — **P0 AI thật + safety** |
| Chat hỏi đáp | Ít | ✓ mock | USP — **P0** Workers AI + disclaimer mỗi reply |
| Ads / Premium | Có | Placeholder + demo toggle | **P0** IAP + bỏ demo store |
| Trial Pro | Hiếm in-app | **Chưa** | **P0** (Dat bắt buộc) |
| Widget / Watch | Có | ✗ | P2 |
| Phong thủy / thần số | Có | ✗ | P2 (non-goal P0 trừ khi pivot) |
| Privacy / Terms / age | Bắt buộc store | Ghi chú README, chưa URL in-app | **P0** legal |

**Định vị đề xuất:** Đừng đua “lịch đầy đủ như Lịch Việt” ở v1. Ship: **lịch đủ dùng + AI tử vi/tướng số/chat giải trí** + trial 7 ngày. Roadmap lịch sâu = P1.

---

## 3. Spec ngắn — Trial Pro 7 ngày

### 3.1 Mục tiêu
User mới **trải nghiệm full Pro 7 ngày** (no ads, unlimited tử vi/tướng số/chat), sau đó **tự về Free** + ads/limits; paywall rõ để convert.

### 3.2 Entitlement model (logic)

```
effectivePro = paidPro OR (trialActive AND now < trial_ends_at)
```

| State | `paidPro` | Trial | Ads | Limits |
|-------|-----------|-------|-----|--------|
| Free (chưa/ hết trial) | false | inactive/expired | Có | Free limits |
| **Trialing** | false | active | **Không** | **Unlimited** (= Pro) |
| Paid Pro | true | n/a | Không | Unlimited |

Nguồn sự thật đề xuất: **Supabase `profiles`** (+ RevenueCat cho paid). Client chỉ cache; **không** tin toggle local trên bản store.

### 3.3 Trigger (đề xuất BA — cần Dat/PM chốt 1)

| Option | Trigger | Ưu | Nhược |
|--------|---------|----|------|
| **A (khuyến nghị)** | Sau **đăng ký thành công** + hoàn tất onboarding ngày sinh | Đúng “Free có trial”; đủ profile cho tử vi | Cần account — giảm abuse ẩn danh |
| B | Ngay lần mở app đầu (trước auth) | Conversion cao hơn | Abuse reinstall nặng; khó gắn `trial_used` |
| C | Soft: user bấm “Bắt đầu dùng thử 7 ngày” trên paywall | Rõ consent | Thêm 1 bước; dễ bỏ lỡ trial |

**BA lock tạm cho spec:** **Option A**.  
Nếu Dat muốn B → bắt buộc Device ID + account merge anti-abuse.

### 3.4 Data fields (profiles)

| Field | Type | Ý nghĩa |
|-------|------|---------|
| `trial_started_at` | timestamptz nullable | Lúc bắt đầu trial |
| `trial_ends_at` | timestamptz nullable | `started + 7 days` |
| `trial_consumed` | boolean default false | Đã từng nhận trial (anti re-trial) |
| `is_pro` | boolean | **Paid** Pro only (không set true vì trial) |
| `entitlement_source` | text | `none` \| `trial` \| `revenuecat` \| `promo` |

*Hoặc* giữ `is_pro` = effective và thêm `pro_reason` — BA khuyến nghị **tách paid vs trial** để analytics/churn sạch.

### 3.5 UX

1. **Start:** Toast/banner “Pro dùng thử · còn 7 ngày” sau onboarding.  
2. **Countdown:** Tab Pro + banner nhẹ Hôm nay: “Trial còn X ngày Y giờ”.  
3. **Day 5–6:** Soft paywall sheet (không block đọc lịch).  
4. **Hết trial:**  
   - Force `effectivePro = false`  
   - Modal 1 lần: “Hết dùng thử — bạn về Free (1 tử vi/ngày, 1 tướng số/tuần, 5 chat/ngày + ads). Nâng Pro?”  
   - CTA: Mua Pro / Để sau  
5. **Trong trial:** Ẩn ads; limits = Pro; **không** hiện “Mua ngay” cứng mỗi lần mở (chỉ countdown + Pro tab).  
6. **Store build:** Ẩn “Mở khóa Pro demo” switch.

### 3.6 Anti-abuse (P0 tối thiểu)

| Vector | Mitigation |
|--------|------------|
| Đăng ký email mới để lấy trial lại | `trial_consumed` per `auth.users.id`; optional: limit trial / device (`installation_id`) |
| Xóa app / clear AsyncStorage | Trial state **server** (Supabase), không chỉ local |
| Đổi đồng hồ máy | So sánh `trial_ends_at` với **server time** (RPC hoặc response header) |
| Demo auth offline | Trial **không** cấp khi `isDemoAuth` / thiếu Supabase — hoặc trial local 7 ngày không restore |
| Restore purchases | Không restore trial; chỉ restore **paid** IAP |

### 3.7 Hết trial → Free
- Counters Free **reset theo ngày/tuần như hiện tại** (không “trừ âm” vì đã dùng unlimited trong trial).  
- Không xóa lịch sử chat/tử vi đã gen (nếu có persist); chỉ gate lần gen mới.

### 3.8 Analytics events (nên có)
`trial_started`, `trial_reminder_d5`, `trial_expired`, `paywall_view`, `purchase_success`, `purchase_restore`.

---

## 4. Free / Pro / Trial matrix (cập nhật)

| Tính năng | Free | Trial 7 ngày | Pro (paid) |
|-----------|------|--------------|------------|
| Lịch vạn sự hôm nay | ✓ | ✓ | ✓ |
| Tử vi ngày | 1/ngày | Unlimited | Unlimited |
| Tướng số ảnh | 1/tuần | Unlimited | Unlimited |
| Chat AI | 5 tin/ngày | Unlimited | Unlimited |
| Quảng cáo | Có | **Không** | **Không** |
| Countdown trial | — | ✓ | — |
| IAP / Restore | CTA nâng cấp | CTA (soft) | Active / manage |
| Demo toggle `isPro` | Dev only | Dev only | **Ẩn store** |

---

## 5. Acceptance criteria — Trial + entitlement

### US-T1 — Bắt đầu trial
**AC:**
1. User đăng ký cloud + hoàn tất onboarding ngày sinh lần đầu → `trial_consumed=false` → set `trial_started_at=now`, `trial_ends_at=now+7d`, `trial_consumed=true`.  
2. Không start trial lần 2 nếu `trial_consumed=true` (kể cả reinstall + login cùng account).  
3. Demo/offline auth: **không** ghi trial cloud; UI không hứa “7 ngày Pro” như production.  
4. Banner “Pro dùng thử · 7 ngày” hiện ≤ 1 lần / session đầu.

### US-T2 — Trong trial = quyền Pro
**AC:**
1. `effectivePro=true` → unlimited tử vi/tướng số/chat; ads ẩn.  
2. Tab Pro hiện countdown đúng (sai lệch ≤ 1 giờ so với server).  
3. Không cộng Free counters khi `effectivePro`.

### US-T3 — Hết trial
**AC:**
1. Khi `now >= trial_ends_at` và chưa paid → `effectivePro=false`.  
2. Modal hết trial 1 lần; sau đó Free limits áp dụng request tiếp theo.  
3. Ads hiện lại (khi AdMob bật).  
4. User mua Pro trong/sau trial → paid thắng; trial có thể đánh dấu ended.

### US-T4 — Anti-abuse & sync
**AC:**
1. Clear app data + login lại cùng user → **không** trial mới.  
2. `is_pro` paid chỉ flip qua RevenueCat webhook/SDK (hoặc server validate) — client không tự `is_pro=true` trên store build.  
3. Restore purchases không gia hạn trial.

### US-T5 — Paywall
**AC:**
1. Khi Free hit limit → sheet có: đếm remaining, “Dùng Pro”, nếu còn trial thì không; nếu hết trial thì giá/IAP.  
2. Copy disclaimer giải trí trên paywall.

---

## 6. Backlog bổ sung P0 / P1 / P2

### P0 — trước ship public (block)

| # | Hạng mục | Việc |
|---|----------|------|
| P0-1 | **Trial 7 ngày** | Spec §3 + migration fields + UX countdown/expiry + AC §5 |
| P0-2 | **Entitlement** | Tách trial vs paid; bỏ/ẩn demo Switch trên store; RevenueCat entitlement `pro` sync |
| P0-3 | **IAP** | Product tháng/năm (chốt giá); purchase + restore hoạt động TestFlight/Play internal |
| P0-4 | **Legal store** | Privacy Policy + Terms URL in-app; age rating; disclaimer cố định; không claim “chính xác tuyệt đối / tư vấn chuyên môn” |
| P0-5 | **AI tối thiểu** | ≥ 1 trong {tử vi, chat, tướng số} gọi backend thật (Workers AI / API); fail state + disclaimer; không ship toàn mock nếu store listing nói “AI” |
| P0-6 | **Auth production** | Supabase bắt buộc store build; email confirm policy chốt; cấm demo banner trên prod |
| P0-7 | **Paywall khi chạm limit** | Deep-link tab Pro / purchase; copy Free remaining |
| P0-8 | **Usage (tối thiểu)** | Nếu multi-device quan trọng: sync counters hoặc chấp nhận risk local + ghi rõ; **trial phải server** |

### P1 — sau soft launch / retention

| # | Hạng mục | Việc |
|---|----------|------|
| P1-1 | Lịch | Tiết khí, ngày lễ VN, chọn ngày tốt theo 5–10 việc phổ biến |
| P1-2 | Tử vi | Tháng/năm; lưu lịch sử luận giải |
| P1-3 | Tướng số | Model/vision API + safety (ảnh người, từ chối ảnh không phù hợp) |
| P1-4 | Chat | Streaming, suggested prompts, rate limit server |
| P1-5 | Retention | Push “ngày mới / trial còn 2 ngày” (opt-in); streak nhẹ |
| P1-6 | Ads | AdMob banner thật (Free only); không ads trong trial/Pro |
| P1-7 | Onboarding | Giải thích trial + giá trị Pro trước khi vào tabs |
| P1-8 | Support | Xóa tài khoản (store requirement), export/xóa hồ sơ sinh |

### P2 — moat / parity đối thủ

| # | Việc |
|---|------|
| P2-1 | Widget lịch âm |
| P2-2 | Phong thủy / thần số học |
| P2-3 | Lá số tử vi đầy đủ / đại vận |
| P2-4 | Social share card tử vi ngày |
| P2-5 | Promo codes / partner trial |
| P2-6 | Apple Watch |

---

## 7. Non-goals (P0)

- Không phải tư vấn tâm linh / y / tài chính chuyên nghiệp.  
- Không parity Lịch Việt trong v1.  
- Không live thầy / gọi điện.  
- Không Web admin phức tạp trước IAP+trial ổn định.

---

## 8. Open questions (Dat / CoS)

1. Chốt trigger trial: **A đăng ký+onboarding** (BA khuyến nghị) hay B/C?  
2. Giá Pro: tháng / năm / lifetime?  
3. Store listing có được nói “AI” khi mới 1 surface thật không?  
4. Có bắt sync Free usage lên cloud trước v1 không?  
5. Tướng số: có policy ảnh nhạy cảm / trẻ em không? (nên **cấm** phân tích trẻ vị thành niên — legal)

---

## 8b. Code confirmation (executor read-only, 2026-09-13)

- Onboarding = `OnboardingModal` (không route riêng); AuthGate trong `app/_layout.tsx`.
- AdMob: placement `banner_home` | `interstitial_limit` | `rewarded_extra` — `showInterstitial` **chưa wire** vào màn hình; chỉ `AdPlaceholder` UI.
- RevenueCat: `purchasePro`/`restore` trả `success: false`; `configurePurchases` **không** gọi bootstrap.
- Limit-hit UX: Alert → “Xem Pro” → `/pro` (chưa hard paywall sheet).
- Mocks: `horoscope.ts`, `face-analysis.ts` (`mockFaceAnalysis` bỏ qua bytes ảnh), `chat.ts` (`mockChatReply`); calendar = real local `calendar.ts`.

## 9. Next cho Eng (không làm trong task BA)

- Migration: `trial_*` columns + RLS giữ nguyên own-row.  
- `getEntitlement()` single source trong AppContext.  
- Feature flag `STORE_BUILD` ẩn demo toggle.  
- Gắn RC offerings + mapping entitlement.

---

*File: `/workspace/van-su-ai/docs/BA-FEATURE-GAP.md` · Báo CoS.*

---

## 10. Spot-check BA vs code @ `47e83ad` (2026-09-13)

**Verdict:** Trial Option A + Free/Trial/Pro matrix **aligned** với §3–§5. Unit tests entitlement **6/6 pass**.

| AC / item | Status |
|-----------|--------|
| US-T1 Trigger A (signup cloud + birth_date) via `start_trial_if_eligible` | ✅ |
| `trial_*` + `entitlement_source`; `is_pro` paid-only | ✅ |
| US-T2 `effectivePro` = paid OR trial active; ads/limits dùng `effectivePro` | ✅ |
| Countdown + TrialBanner / soft D5–6 | ✅ |
| US-T3 TrialExpiredModal 1× + copy Free limits | ✅ |
| US-T4 No trial khi demo auth; no re-trial `trial_consumed`; restore copy không gia hạn trial | ✅ |
| US-T5 PaywallSheet khi hết lượt (tu-vi / tướng số / chat) + disclaimer | ✅ |
| Matrix Free/Trial/Pro trên Pro tab | ✅ |
| Demo toggle ẩn store (`canShowDemoProToggle`) | ✅ |
| Legal Privacy/Terms in-app | ✅ |
| Device-ID anti-abuse | ❌ chưa (chỉ account-level) |
| Sync Free usage cloud | ❌ vẫn AsyncStorage |
| IAP RevenueCat thật | ⚠️ stub hooks — chưa SDK mua được |
| AI production | ⚠️ pluggable + worker mẫu; default vẫn mock nếu thiếu env |
| Analytics `trial_*` events | ❌ chưa thấy |
| Countdown vs server clock | ⚠️ start dùng `now()` server; remaining evaluate client |

**Còn mở trước store thu tiền:** RC SDK + products · AdMob thật · AI env prod · (optional) device anti-abuse · analytics.

*Spot-check BA — báo CoS.*


---

## 11. Eng follow-up (2026-09-13) — RLS lock + personalized AI

**Đã làm:**
- Entitlement columns **client read-only** (column GRANT + trigger). Trial chỉ `start_trial_if_eligible`. Paid: `apply_paid_pro` / service_role. App **bỏ** fallback `UPDATE trial_*`.
- Access flow lock: Free signup → onboarding → trial. Không trial trước đăng ký.
- `user_traits` + `horoscope_chats` (RLS own-only).
- Tab Tử vi hội thoại nhiều lượt; `callAi` + system prompt; mock offline.

**Cách test:** xem `docs/PILOT-CHECKLIST.md` §3.

*Eng — báo CoS / Dat.*
