/**
 * AdMob placeholder module.
 *
 * TODO: Install `react-native-google-mobile-ads` (or expo config plugin),
 * set EXPO_PUBLIC_ADMOB_BANNER_ID / INTERSTITIAL_ID in .env,
 * initialize SDK in app bootstrap, and replace AdPlaceholder UI.
 *
 * Never commit real production ad unit IDs as secrets in git if policy requires
 * private config — use EAS secrets / env for store builds.
 */

export type AdPlacement = 'banner_home' | 'interstitial_limit' | 'rewarded_extra';

export function isAdMobConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_ADMOB_BANNER_ID);
}

export async function showInterstitial(_placement: AdPlacement): Promise<boolean> {
  // TODO: load & show interstitial when SDK is wired
  console.info('[AdMob] placeholder interstitial', _placement);
  return false;
}

export function getBannerUnitId(): string | null {
  return process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? null;
}
