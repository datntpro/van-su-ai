/**
 * RevenueCat / IAP service (stub with clear hooks for store builds).
 *
 * Setup:
 * 1. Install `react-native-purchases` (dev client / EAS — not Expo Go friendly for full IAP).
 * 2. Set EXPO_PUBLIC_REVENUECAT_API_KEY via EAS secrets (appl_… / goog_…).
 * 3. Dashboard: entitlement id `pro`, products monthly/yearly.
 * 4. Call configurePurchases(userId) after auth; syncPaidProFromCustomerInfo() maps entitlement → is_pro.
 *
 * Local paid Pro only via RC CustomerInfo or explicit server field.
 * Store build MUST NOT flip is_pro from random UI (demo toggle is __DEV__ only).
 *
 * Never put service_role or RC secret keys in EXPO_PUBLIC_* beyond the public SDK key.
 */

import { isStoreBuild } from '@/src/lib/flags';

export type OfferingId = 'default';
export const PRO_ENTITLEMENT_ID = 'pro';

let configured = false;
let lastUserId: string | undefined;

export function isRevenueCatConfigured(): boolean {
  return Boolean((process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '').trim());
}

/**
 * Init Purchases SDK once. Safe to call multiple times (idempotent stub).
 */
export async function configurePurchases(userId?: string): Promise<void> {
  const key = (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '').trim();
  if (!key) {
    console.info('[RevenueCat] skip configure — no EXPO_PUBLIC_REVENUECAT_API_KEY');
    return;
  }
  if (configured && lastUserId === userId) return;

  // TODO when SDK installed:
  // import Purchases from 'react-native-purchases';
  // Purchases.configure({ apiKey: key, appUserID: userId });
  configured = true;
  lastUserId = userId;
  console.info('[RevenueCat] stub configure', { userId, storeBuild: isStoreBuild() });
}

/**
 * Read CustomerInfo and return whether entitlement `pro` is active.
 * Returns null when SDK not wired / not configured (caller keeps server state).
 */
export async function syncPaidProFromCustomerInfo(): Promise<boolean | null> {
  if (!isRevenueCatConfigured() || !configured) return null;

  // TODO:
  // const info = await Purchases.getCustomerInfo();
  // return Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);
  console.info('[RevenueCat] stub syncPaidProFromCustomerInfo → null');
  return null;
}

export async function purchasePro(): Promise<{
  success: boolean;
  message: string;
  paid?: boolean;
}> {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      message:
        'IAP chưa cấu hình. Thêm EXPO_PUBLIC_REVENUECAT_API_KEY (EAS secret) và gắn react-native-purchases.',
    };
  }

  // TODO: const { customerInfo } = await Purchases.purchasePackage(pkg);
  // const paid = Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]);
  // return { success: paid, paid, message: paid ? 'Đã kích hoạt Pro!' : 'Mua chưa hoàn tất.' };

  return {
    success: false,
    message:
      'RevenueCat SDK chưa gắn trong build này. Dùng TestFlight/internal với Purchases để mua thật.',
  };
}

export async function restorePurchases(): Promise<{
  success: boolean;
  message: string;
  paid?: boolean;
}> {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      message: 'Khôi phục mua hàng cần EXPO_PUBLIC_REVENUECAT_API_KEY.',
    };
  }

  // TODO: restore — does NOT renew trial; only restores paid entitlement
  // const info = await Purchases.restorePurchases();
  // const paid = Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);

  return {
    success: false,
    message:
      'Restore sẽ chỉ khôi phục Pro đã mua (không gia hạn trial). SDK chưa gắn.',
  };
}
