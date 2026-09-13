/**
 * RevenueCat / IAP placeholder module.
 *
 * TODO: Install `react-native-purchases`, configure API key via
 * EXPO_PUBLIC_REVENUECAT_API_KEY (EAS secret for production),
 * define entitlement `pro`, and sync `isPro` from CustomerInfo.
 *
 * Current MVP uses a local AsyncStorage `isPro` toggle for demo unlock.
 */

export type OfferingId = 'default';

export function isRevenueCatConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY);
}

export async function configurePurchases(_userId?: string): Promise<void> {
  // TODO: Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY! })
  console.info('[RevenueCat] placeholder configure');
}

export async function purchasePro(): Promise<{ success: boolean; message: string }> {
  // TODO: purchase package from current offering
  return {
    success: false,
    message: 'IAP chưa cấu hình — dùng nút “Mở khóa Pro (demo)” trong Cài đặt.',
  };
}

export async function restorePurchases(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Khôi phục mua hàng sẽ hoạt động sau khi gắn RevenueCat.',
  };
}
