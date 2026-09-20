# IAP / RevenueCat — Van Su AI

## Products (đề xuất)

| Store product id (gợi ý) | Type | RC package | Entitlement |
|--------------------------|------|------------|-------------|
| `vansu_pro_monthly` | Auto-renewable / sub | `$rc_monthly` | `pro` |
| `vansu_pro_yearly` | Auto-renewable / sub | `$rc_yearly` | `pro` |

- Offering id: **`default`**
- Entitlement id: **`pro`** (khớp `PRO_ENTITLEMENT_ID` trong `src/services/revenuecat.ts`)

Giá: chốt trên App Store Connect / Play Console → gắn vào RevenueCat.

## Env

```bash
# Public SDK key only (appl_… iOS / goog_… Android). EAS Secrets for store.
EXPO_PUBLIC_REVENUECAT_API_KEY=goog_xxx_or_appl_xxx
```

**Không** commit secret server / Play service account. **Không** đặt Supabase `service_role` trong Expo.

## Native build path (bắt buộc cho mua thật)

`react-native-purchases` **không** chạy full IAP trên Expo Go.

```bash
# Dev client / local
npx expo prebuild
npx expo run:android   # hoặc run:ios

# Store
eas build -p android --profile production
# EAS Secrets: EXPO_PUBLIC_REVENUECAT_API_KEY, Supabase, AI…
```

Sau prebuild, SDK `configure` + `purchasePackage` / `restorePurchases` hoạt động nếu key + products đúng.

## Client vs cloud entitlement

| Layer | Hành vi |
|-------|---------|
| Client sau mua | `applyPaidFromRevenueCat(true)` — soft local / UX |
| Cloud `profiles.is_pro` | **Chỉ** `service_role` / RPC `apply_paid_pro` (RLS khóa client) |
| Demo toggle | Chỉ `__DEV__` + không store build — local AsyncStorage |

### Webhook (Dat phải làm)

1. Supabase Edge Function nhận RevenueCat webhook.
2. Map `app_user_id` → `auth.users.id`.
3. Gọi `apply_paid_pro` (hoặc `UPDATE` với service_role).
4. App: `refreshEntitlement()` sau restore / khi mở lại.

Cho đến khi webhook lên: paid Pro trên device vẫn hiệu lực local sau purchase; multi-device / reinstall dựa cloud sẽ **chưa** sync.

## Paywall UI

- Tab **Pro**: Mua / Restore + danh sách packages khi SDK + offering có data.
- `PaywallSheet`: CTA → Pro; hiện giá nếu đã fetch packages.

## Checklist

- [ ] RC project + apps iOS/Android
- [ ] Products + entitlement `pro` + offering `default`
- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY` trên EAS
- [ ] EAS/dev client build (không Expo Go)
- [ ] Webhook → `apply_paid_pro`
- [ ] Test purchase sandbox + restore
