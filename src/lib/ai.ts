/**
 * Pluggable AI client.
 * If EXPO_PUBLIC_AI_API_URL + EXPO_PUBLIC_AI_API_KEY are set → call remote API.
 * Else → improved local mock with clear "mock" badge in __DEV__.
 *
 * Contract (POST JSON):
 *   Request:  { type: 'horoscope'|'chat', profile?, date?, message?, history? }
 *   Response: { text: string, model?: string }
 * Auth: Authorization: Bearer <EXPO_PUBLIC_AI_API_KEY>
 */

import type { UserProfile } from './profile';
import { getAiApiKey, getAiApiUrl, isAiApiConfigured } from './flags';
import { DISCLAIMER } from '@/src/theme/colors';

export type AiSurface = 'horoscope' | 'chat';

export type AiResult = {
  text: string;
  source: 'api' | 'mock';
  /** Show mock badge in __DEV__ when source === 'mock' */
  showMockBadge: boolean;
};

function withDisclaimer(body: string): string {
  const trimmed = body.trim();
  if (trimmed.includes(DISCLAIMER) || trimmed.includes('giải trí')) {
    return trimmed;
  }
  return `${trimmed}\n\n— ${DISCLAIMER} —`;
}

export async function callAi(params: {
  type: AiSurface;
  profile: UserProfile;
  date?: string;
  message?: string;
}): Promise<AiResult> {
  if (isAiApiConfigured()) {
    const url = getAiApiUrl()!;
    const key = getAiApiKey()!;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          type: params.type,
          profile: params.profile,
          date: params.date ?? new Date().toISOString(),
          message: params.message,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data.text?.trim()) {
          return {
            text: withDisclaimer(data.text),
            source: 'api',
            showMockBadge: false,
          };
        }
      }
      console.warn('[ai] API non-OK', res.status);
    } catch (e) {
      console.warn('[ai] API failed, falling back to mock', e);
    }
  }

  // Legacy optional mock URL (no key)
  const mockUrl = (process.env.EXPO_PUBLIC_MOCK_AI_URL ?? '').trim();
  if (mockUrl) {
    try {
      const res = await fetch(mockUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data.text?.trim()) {
          return {
            text: withDisclaimer(data.text),
            source: 'mock',
            showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  return {
    text: '',
    source: 'mock',
    showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
  };
}

export function mockBadgeLabel(): string {
  return 'MOCK AI';
}
