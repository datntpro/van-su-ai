import * as Linking from 'expo-linking';

import { getSupabase } from '@/src/lib/supabase';

/** Path segment used with app scheme `vansuai` → `vansuai://auth/callback`. */
export const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Redirect target for Supabase email confirm / magic links.
 * Prefer Linking.createURL so Expo Go vs standalone both resolve correctly;
 * production APK with scheme `vansuai` yields `vansuai://auth/callback`.
 */
export function getAuthRedirectTo(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

/** Explicit scheme URL for Dashboard allowlist docs / fallback. */
export const AUTH_REDIRECT_SCHEME_URL = 'vansuai://auth/callback';

function pickParam(
  params: Record<string, string | string[] | undefined> | URLSearchParams | null | undefined,
  key: string,
): string | undefined {
  if (!params) return undefined;
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }
  const v = params[key];
  if (typeof v === 'string' && v) return v;
  if (Array.isArray(v) && typeof v[0] === 'string' && v[0]) return v[0];
  return undefined;
}

/**
 * Complete Supabase session from an email-confirm / OAuth deep link.
 * Handles PKCE `?code=` and implicit `#access_token=&refresh_token=`.
 * Safe no-op when URL has no auth payload or Supabase is not configured.
 */
export async function completeAuthSessionFromUrl(url: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !url) return false;

  try {
    // Only handle our auth callback (avoid touching unrelated deep links).
    const lower = url.toLowerCase();
    if (
      !lower.includes('auth/callback') &&
      !lower.includes('access_token') &&
      !lower.includes('refresh_token') &&
      !/[?&#]code=/.test(lower)
    ) {
      return false;
    }

    let code: string | undefined;
    let access_token: string | undefined;
    let refresh_token: string | undefined;

    const parsed = Linking.parse(url);
    code = pickParam(parsed.queryParams as Record<string, string | string[] | undefined>, 'code');
    access_token = pickParam(
      parsed.queryParams as Record<string, string | string[] | undefined>,
      'access_token',
    );
    refresh_token = pickParam(
      parsed.queryParams as Record<string, string | string[] | undefined>,
      'refresh_token',
    );

    const hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      const hashParams = new URLSearchParams(url.slice(hashIdx + 1));
      code = code ?? pickParam(hashParams, 'code');
      access_token = access_token ?? pickParam(hashParams, 'access_token');
      refresh_token = refresh_token ?? pickParam(hashParams, 'refresh_token');
    }

    const qIdx = url.indexOf('?');
    if (qIdx >= 0) {
      const q = url.slice(qIdx + 1).split('#')[0];
      const queryParams = new URLSearchParams(q);
      code = code ?? pickParam(queryParams, 'code');
      access_token = access_token ?? pickParam(queryParams, 'access_token');
      refresh_token = refresh_token ?? pickParam(queryParams, 'refresh_token');
    }

    if (code) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn('[auth] exchangeCodeForSession', error.message);
        return false;
      }
      return true;
    }

    if (access_token && refresh_token) {
      const { error } = await sb.auth.setSession({ access_token, refresh_token });
      if (error) {
        console.warn('[auth] setSession from deep link', error.message);
        return false;
      }
      return true;
    }

    return false;
  } catch (e) {
    console.warn('[auth] deep link handle failed', e);
    return false;
  }
}
