/**
 * Build / runtime feature flags.
 * Store builds must not expose demo Pro toggle or promise cloud trial offline.
 */

/** True when packaging for App Store / Play (EAS: EXPO_PUBLIC_STORE_BUILD=1). */
export function isStoreBuild(): boolean {
  return process.env.EXPO_PUBLIC_STORE_BUILD === '1';
}

/**
 * Demo "Mở khóa Pro" toggle — only in __DEV__, never on store builds.
 * Prefer: hide unless __DEV__.
 */
export function canShowDemoProToggle(): boolean {
  if (isStoreBuild()) return false;
  return typeof __DEV__ !== 'undefined' ? __DEV__ : false;
}

/** Real AI endpoint configured? */
export function isAiApiConfigured(): boolean {
  const url = (process.env.EXPO_PUBLIC_AI_API_URL ?? '').trim();
  const key = (process.env.EXPO_PUBLIC_AI_API_KEY ?? '').trim();
  return Boolean(url && key);
}

export function getAiApiUrl(): string | null {
  const url = (process.env.EXPO_PUBLIC_AI_API_URL ?? '').trim();
  return url || null;
}

export function getAiApiKey(): string | null {
  const key = (process.env.EXPO_PUBLIC_AI_API_KEY ?? '').trim();
  return key || null;
}
