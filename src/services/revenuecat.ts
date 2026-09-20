/**
 * RevenueCat / IAP service.
 *
 * - Uses `react-native-purchases` when native module is available (dev client / EAS /
 *   prebuild). Expo Go → graceful stub messages (no crash).
 * - Client MUST NOT UPDATE profiles.is_pro (RLS). After purchase:
 *   1) Soft local flag via applyPaidFromRevenueCat (cache / UX)
 *   2) Cloud: RevenueCat → webhook / Edge Function with service_role → apply_paid_pro
 *
 * Env: EXPO_PUBLIC_REVENUECAT_API_KEY (public SDK key appl_… / goog_… via EAS Secrets)
 * Products (dashboard): entitlement id `pro`; packages monthly / yearly on offering `default`.
 */

import { Platform } from 'react-native';

import { isStoreBuild } from '@/src/lib/flags';

export type OfferingId = 'default';
export const PRO_ENTITLEMENT_ID = 'pro';
export const DEFAULT_OFFERING_ID = 'default';

export type RcPackageInfo = {
  identifier: string;
  packageType: string;
  productId: string;
  title: string;
  description: string;
  priceString: string;
  /** Opaque SDK package for purchasePackage */
  raw: unknown;
};

type PurchasesSdk = {
  configure: (cfg: { apiKey: string; appUserID?: string }) => void;
  setLogLevel?: (level: unknown) => Promise<void> | void;
  LOG_LEVEL?: { DEBUG?: unknown; INFO?: unknown };
  getCustomerInfo: () => Promise<{ entitlements?: { active?: Record<string, unknown> } }>;
  getOfferings: () => Promise<{
    current?: { availablePackages?: unknown[] };
    all?: Record<string, { availablePackages?: unknown[] }>;
  }>;
  purchasePackage: (pkg: unknown) => Promise<{ customerInfo: { entitlements?: { active?: Record<string, unknown> } } }>;
  restorePurchases: () => Promise<{ entitlements?: { active?: Record<string, unknown> } }>;
};

let configured = false;
let lastUserId: string | undefined;
let PurchasesSdk: PurchasesSdk | null | undefined;

async function loadPurchases(): Promise<PurchasesSdk | null> {
  if (PurchasesSdk !== undefined) return PurchasesSdk;
  try {
    // Native module — missing in Expo Go / web
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    PurchasesSdk = (mod?.default ?? mod) as PurchasesSdk;
    return PurchasesSdk;
  } catch (e) {
    console.info('[RevenueCat] native module unavailable (Expo Go / web?)', e);
    PurchasesSdk = null;
    return null;
  }
}

export function isRevenueCatConfigured(): boolean {
  return Boolean((process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '').trim());
}

export function isPurchasesNativeAvailable(): boolean {
  return PurchasesSdk != null;
}

/**
 * Init Purchases SDK once. Safe to call multiple times.
 */
export async function configurePurchases(userId?: string): Promise<void> {
  const key = (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '').trim();
  if (!key) {
    console.info('[RevenueCat] skip configure — no EXPO_PUBLIC_REVENUECAT_API_KEY');
    return;
  }
  if (configured && lastUserId === userId) return;

  const Purchases = await loadPurchases();
  if (!Purchases) {
    configured = true;
    lastUserId = userId;
    console.info('[RevenueCat] stub configure (no native module)', {
      userId,
      storeBuild: isStoreBuild(),
      platform: Platform.OS,
    });
    return;
  }

  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__ && Purchases.setLogLevel) {
      void Purchases.setLogLevel(Purchases.LOG_LEVEL?.DEBUG ?? Purchases.LOG_LEVEL?.INFO);
    }
    Purchases.configure({
      apiKey: key,
      appUserID: userId,
    });
    configured = true;
    lastUserId = userId;
    console.info('[RevenueCat] configured', { userId, storeBuild: isStoreBuild() });
  } catch (e) {
    console.warn('[RevenueCat] configure failed', e);
    configured = true;
    lastUserId = userId;
  }
}

function entitlementActive(info: {
  entitlements?: { active?: Record<string, unknown> };
}): boolean {
  return Boolean(info?.entitlements?.active?.[PRO_ENTITLEMENT_ID]);
}

/**
 * Read CustomerInfo — whether entitlement `pro` is active.
 * null = SDK not wired / not configured (caller keeps server state).
 */
export async function syncPaidProFromCustomerInfo(): Promise<boolean | null> {
  if (!isRevenueCatConfigured() || !configured) return null;
  const Purchases = await loadPurchases();
  if (!Purchases) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return entitlementActive(info);
  } catch (e) {
    console.warn('[RevenueCat] getCustomerInfo failed', e);
    return null;
  }
}

export async function getOfferingsPackages(): Promise<{
  packages: RcPackageInfo[];
  message?: string;
}> {
  if (!isRevenueCatConfigured()) {
    return {
      packages: [],
      message: 'Chưa có EXPO_PUBLIC_REVENUECAT_API_KEY.',
    };
  }
  const Purchases = await loadPurchases();
  if (!Purchases) {
    return {
      packages: [],
      message:
        'RevenueCat cần native build (EAS / prebuild). Expo Go không mua IAP được — dùng stub CTA.',
    };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? offerings.all?.[DEFAULT_OFFERING_ID];
    const pkgs = current?.availablePackages ?? [];
    const packages: RcPackageInfo[] = pkgs.map((p: {
      identifier: string;
      packageType: string;
      product: { identifier: string; title: string; description: string; priceString: string };
    }) => ({
      identifier: p.identifier,
      packageType: String(p.packageType),
      productId: p.product.identifier,
      title: p.product.title,
      description: p.product.description,
      priceString: p.product.priceString,
      raw: p,
    }));
    if (!packages.length) {
      return {
        packages: [],
        message:
          'Chưa có package trên offering `default`. Tạo product + entitlement `pro` trên RevenueCat.',
      };
    }
    return { packages };
  } catch (e) {
    console.warn('[RevenueCat] getOfferings failed', e);
    return {
      packages: [],
      message: 'Không tải được gói IAP. Kiểm tra API key / store products.',
    };
  }
}

export async function purchasePro(packageOrUndefined?: RcPackageInfo): Promise<{
  success: boolean;
  message: string;
  paid?: boolean;
}> {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      message:
        'IAP chưa cấu hình. Thêm EXPO_PUBLIC_REVENUECAT_API_KEY (EAS secret) + products trên RevenueCat.',
    };
  }

  const Purchases = await loadPurchases();
  if (!Purchases) {
    return {
      success: false,
      message:
        'RevenueCat SDK có trong package.json nhưng native module chưa gắn (cần EAS/dev client, không phải Expo Go). Xem docs/IAP-REVENUECAT.md.',
    };
  }

  try {
    let pkg = packageOrUndefined?.raw;
    if (!pkg) {
      const { packages, message } = await getOfferingsPackages();
      if (!packages.length) {
        return { success: false, message: message ?? 'Không có gói để mua.' };
      }
      // Prefer annual then monthly then first
      const preferred =
        packages.find((p) => /annual|year/i.test(p.identifier + p.packageType)) ??
        packages.find((p) => /month/i.test(p.identifier + p.packageType)) ??
        packages[0];
      pkg = preferred.raw;
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg as never);
    const paid = entitlementActive(customerInfo);
    return {
      success: paid,
      paid,
      message: paid
        ? 'Đã kích hoạt Pro! Đồng bộ cloud qua webhook RevenueCat → apply_paid_pro (service_role).'
        : 'Mua chưa kích hoạt entitlement `pro`. Kiểm tra dashboard RC.',
    };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) {
      return { success: false, message: 'Bạn đã huỷ giao dịch.' };
    }
    console.warn('[RevenueCat] purchase failed', e);
    return {
      success: false,
      message: err?.message ?? 'Mua hàng thất bại.',
    };
  }
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

  const Purchases = await loadPurchases();
  if (!Purchases) {
    return {
      success: false,
      message:
        'Restore cần native Purchases SDK (EAS build). Không gia hạn trial — chỉ khôi phục Pro đã mua.',
    };
  }

  try {
    const info = await Purchases.restorePurchases();
    const paid = entitlementActive(info);
    return {
      success: true,
      paid,
      message: paid
        ? 'Đã khôi phục Pro (paid). Cloud sync qua webhook — không gia hạn trial.'
        : 'Không tìm thấy giao dịch Pro trên tài khoản store này.',
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return {
      success: false,
      message: err?.message ?? 'Restore thất bại.',
    };
  }
}

/**
 * Documented path for cloud is_pro (service_role only).
 * Client never calls this with secrets — implement as Supabase Edge Function
 * listening to RevenueCat webhooks, then RPC apply_paid_pro.
 */
export const PAID_PRO_WEBHOOK_PATH = `
RevenueCat Dashboard → Integrations → Webhooks
  → POST https://<project>.supabase.co/functions/v1/revenuecat-webhook
  → verify auth header
  → service_role: rpc apply_paid_pro(user_id) / UPDATE profiles SET is_pro=true, entitlement_source='revenuecat'
Expo client: soft local flag only (applyPaidFromRevenueCat) + refreshEntitlement after webhook lands.
__DEV__ demo toggle: local AsyncStorage only — never UPDATE is_pro.
`.trim();
