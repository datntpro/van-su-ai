/**
 * AdMob placeholder — show/hide by effectivePro (paid OR active trial → hide).
 *
 * TODO: Install `react-native-google-mobile-ads`, set unit IDs via EAS secrets,
 * initialize SDK in bootstrap, replace AdPlaceholder UI.
 * Keep placeholders; wire visibility only for P0.
 */

export type AdPlacement = 'banner_home' | 'interstitial_limit' | 'rewarded_extra';

export function isAdMobConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_ADMOB_BANNER_ID);
}

/** Ads only when NOT effectivePro (Free / expired trial). */
export function shouldShowAds(effectivePro: boolean): boolean {
  return !effectivePro;
}

export async function showInterstitial(
  _placement: AdPlacement,
  effectivePro = false,
): Promise<boolean> {
  if (!shouldShowAds(effectivePro)) return false;
  // TODO: load & show interstitial when SDK is wired
  console.info('[AdMob] placeholder interstitial', _placement);
  return false;
}

export function getBannerUnitId(): string | null {
  return process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? null;
}
