/**
 * Pluggable AI client.
 * If EXPO_PUBLIC_AI_API_URL + EXPO_PUBLIC_AI_API_KEY are set → call remote API.
 * Else → mock (caller / horoscopeConversation supplies offline text).
 *
 * Contract (POST JSON):
 *   Request:  { type, profile?, traits?, date?, message?, history?, systemPrompt?, skipIntake? }
 *   Response: { text: string, model?: string, traits?: object, readyForReading?: boolean, birthTime?: string }
 * Auth: Authorization: Bearer <EXPO_PUBLIC_AI_API_KEY>
 *
 * Never put service_role in Expo.
 */

import type { UserProfile } from './profile';
import type { UserTraits } from './traits';
import { extractBirthTime } from './traits';
import { getAiApiKey, getAiApiUrl, isAiApiConfigured } from './flags';
import { DISCLAIMER } from '@/src/theme/colors';

export type AiSurface = 'horoscope' | 'chat' | 'horoscope_intake';

export type AiChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export type AiResult = {
  text: string;
  source: 'api' | 'mock';
  showMockBadge: boolean;
  extractedTraits?: Partial<UserTraits>;
  extractedBirthTime?: string;
  readyForReading?: boolean;
};

export const HOROSCOPE_INTAKE_SYSTEM_PROMPT = `Bạn là Van Su AI — trợ lý tử vi / lịch vạn sự tiếng Việt, chỉ mang tính giải trí.

Nhiệm vụ trên tab Tử vi:
1. Hỏi lần lượt thông tin còn thiếu (không hỏi lại cái đã có trong profile/traits):
   - giờ sinh chi tiết
   - giới tính
   - tình trạng hôn nhân / tình cảm
   - công việc
   - điều đang quan tâm
   - mục tiêu năm nay
   - nơi đang sống (nếu hữu ích)
2. Một câu hỏi mỗi lượt, ngắn, thân thiện, tiếng Việt.
3. Khi đã đủ ngữ cảnh (≥3 mục ngoài ngày sinh) HOẶC user bảo bỏ qua / skip: luận giải cá nhân hóa, không generic.
4. Không khẳng định tuyệt đối. Không tư vấn y / tài chính / pháp lý.

Nếu có thể, trả JSON:
{ "text": "...", "traits": { "gender": "...", "relationshipStatus": "...", "career": "...", "concerns": ["..."], "locationCurrent": "...", "questionnaire": { "year_goal": "..." } }, "birthTime": "HH:mm", "readyForReading": true|false }
Nếu không structured, chỉ trả text.`;

function withDisclaimer(body: string): string {
  const trimmed = body.trim();
  if (trimmed.includes(DISCLAIMER) || trimmed.includes('giải trí')) {
    return trimmed;
  }
  return `${trimmed}\n\n— ${DISCLAIMER} —`;
}

function traitsFromUnknown(raw: unknown): Partial<UserTraits> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const out: Partial<UserTraits> = {};
  if (typeof o.gender === 'string') out.gender = o.gender;
  if (typeof o.relationshipStatus === 'string') out.relationshipStatus = o.relationshipStatus;
  if (typeof o.relationship_status === 'string') out.relationshipStatus = o.relationship_status;
  if (typeof o.career === 'string') out.career = o.career;
  if (Array.isArray(o.concerns)) {
    out.concerns = o.concerns.filter((x): x is string => typeof x === 'string');
  }
  if (typeof o.locationCurrent === 'string') out.locationCurrent = o.locationCurrent;
  if (typeof o.location_current === 'string') out.locationCurrent = o.location_current;
  if (typeof o.additionalNotes === 'string') out.additionalNotes = o.additionalNotes;
  if (o.questionnaire && typeof o.questionnaire === 'object') {
    out.questionnaire = o.questionnaire as UserTraits['questionnaire'];
  }
  return Object.keys(out).length ? out : undefined;
}

function parseApiPayload(data: Record<string, unknown>): {
  text: string;
  traits?: Partial<UserTraits>;
  birthTime?: string;
  readyForReading?: boolean;
} {
  let text = typeof data.text === 'string' ? data.text : '';
  let traits = traitsFromUnknown(data.traits);
  let birthTime = typeof data.birthTime === 'string' ? data.birthTime : undefined;
  let readyForReading =
    typeof data.readyForReading === 'boolean' ? data.readyForReading : undefined;

  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const inner = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof inner.text === 'string') text = inner.text;
      traits = traitsFromUnknown(inner.traits) ?? traits;
      if (typeof inner.birthTime === 'string') birthTime = inner.birthTime;
      if (typeof inner.readyForReading === 'boolean') readyForReading = inner.readyForReading;
    } catch {
      // keep raw text
    }
  }

  if (!birthTime && text) birthTime = extractBirthTime(text);
  return { text, traits, birthTime, readyForReading };
}

export async function callAi(params: {
  type: AiSurface;
  profile: UserProfile;
  traits?: UserTraits;
  date?: string;
  message?: string;
  history?: AiChatTurn[];
  systemPrompt?: string;
  skipIntake?: boolean;
}): Promise<AiResult> {
  const payload = {
    type: params.type,
    profile: params.profile,
    traits: params.traits,
    date: params.date ?? new Date().toISOString(),
    message: params.message,
    history: params.history,
    systemPrompt: params.systemPrompt ?? (
      params.type === 'horoscope_intake' ? HOROSCOPE_INTAKE_SYSTEM_PROMPT : undefined
    ),
    skipIntake: params.skipIntake,
  };

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
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const parsed = parseApiPayload(data);
        if (parsed.text.trim()) {
          return {
            text: withDisclaimer(parsed.text),
            source: 'api',
            showMockBadge: false,
            extractedTraits: parsed.traits,
            extractedBirthTime: parsed.birthTime,
            readyForReading: parsed.readyForReading,
          };
        }
      }
      console.warn('[ai] API non-OK', res.status);
    } catch (e) {
      console.warn('[ai] API failed, falling back to mock', e);
    }
  }

  const mockUrl = (process.env.EXPO_PUBLIC_MOCK_AI_URL ?? '').trim();
  if (mockUrl) {
    try {
      const res = await fetch(mockUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const parsed = parseApiPayload(data);
        if (parsed.text.trim()) {
          return {
            text: withDisclaimer(parsed.text),
            source: 'mock',
            showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
            extractedTraits: parsed.traits,
            extractedBirthTime: parsed.birthTime,
            readyForReading: parsed.readyForReading,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  // Empty mock — horoscopeConversation / horoscope.ts fill offline text.
  return {
    text: '',
    source: 'mock',
    showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
  };
}

export function mockBadgeLabel(): string {
  return 'MOCK AI';
}
