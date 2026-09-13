/**
 * Tử vi multi-turn intake: ask clarifying questions, then personalized reading.
 * Mock path is fully offline; API path uses callAi + system prompt.
 */

import type { UserProfile } from './profile';
import type { UserTraits } from './traits';
import {
  applyAnswerToTraits,
  hasEnoughContext,
  mergeTraits,
  nextMissingField,
  traitsSummaryLines,
  type IntakeField,
} from './traits';
import { callAi, HOROSCOPE_INTAKE_SYSTEM_PROMPT, type AiChatTurn, type AiResult } from './ai';
import { generateDailyHoroscope } from './horoscope';

export type HoroscopeTurnResult = {
  assistantText: string;
  source: AiResult['source'];
  showMockBadge: boolean;
  traits: UserTraits;
  birthTime?: string;
  readyForReading: boolean;
  nextField: IntakeField | null;
};

function historyToTurns(
  history: { role: 'user' | 'assistant'; text: string }[],
): AiChatTurn[] {
  return history.map((h) => ({ role: h.role, content: h.text }));
}

function mockAskOrRead(
  profile: UserProfile,
  traits: UserTraits,
  skip: boolean,
): { text: string; ready: boolean; next: IntakeField | null } {
  if (skip || hasEnoughContext(profile.birthTime, traits) || !nextMissingField(profile.birthTime, traits)) {
    return { text: '', ready: true, next: null };
  }
  const next = nextMissingField(profile.birthTime, traits)!;
  const known = traitsSummaryLines(profile.birthTime, traits);
  const preface = known.length
    ? `Mình đã ghi: ${known.join(' · ')}.\n\n`
    : '';
  return {
    text: `${preface}${next.question}`,
    ready: false,
    next,
  };
}

/**
 * One conversational turn. `userMessage` null = opening question.
 * `skip` = user asked to generate now.
 */
export async function horoscopeIntakeTurn(params: {
  profile: UserProfile;
  traits: UserTraits;
  pendingField?: IntakeField | null;
  userMessage?: string | null;
  skip?: boolean;
  history?: { role: 'user' | 'assistant'; text: string }[];
}): Promise<HoroscopeTurnResult> {
  const { profile, skip } = params;
  let traits = params.traits;
  let birthTime: string | undefined;
  const pending = params.pendingField ?? nextMissingField(profile.birthTime, traits);

  if (params.userMessage && pending && !skip) {
    const applied = applyAnswerToTraits(pending.id, params.userMessage, traits);
    traits = applied.traits;
    birthTime = applied.birthTime;
  }

  const profileForAi: UserProfile = {
    ...profile,
    birthTime: birthTime ?? profile.birthTime,
  };

  const ai = await callAi({
    type: 'horoscope_intake',
    profile: profileForAi,
    traits,
    message: params.userMessage ?? undefined,
    history: historyToTurns(params.history ?? []),
    systemPrompt: HOROSCOPE_INTAKE_SYSTEM_PROMPT,
    skipIntake: Boolean(skip),
  });

  if (ai.extractedTraits) {
    traits = mergeTraits(traits, ai.extractedTraits);
  }
  if (ai.extractedBirthTime) {
    birthTime = ai.extractedBirthTime;
  }

  const readyFromAi = Boolean(ai.readyForReading);
  const mock = mockAskOrRead(
    { ...profileForAi, birthTime: birthTime ?? profileForAi.birthTime },
    traits,
    Boolean(skip),
  );

  let assistantText = ai.text.trim();
  let readyForReading = readyFromAi || mock.ready;
  let nextField = mock.next;

  if (!assistantText) {
    if (readyForReading) {
      const reading = await generateDailyHoroscope(
        { ...profileForAi, birthTime: birthTime ?? profileForAi.birthTime },
        new Date(),
        traits,
      );
      return {
        assistantText: reading.text,
        source: reading.source,
        showMockBadge: reading.showMockBadge,
        traits,
        birthTime,
        readyForReading: true,
        nextField: null,
      };
    }
    assistantText = mock.text;
  } else if (readyForReading && !looksLikeReading(assistantText)) {
    const reading = await generateDailyHoroscope(
      { ...profileForAi, birthTime: birthTime ?? profileForAi.birthTime },
      new Date(),
      traits,
    );
    return {
      assistantText: reading.text,
      source: reading.source,
      showMockBadge: reading.showMockBadge,
      traits,
      birthTime,
      readyForReading: true,
      nextField: null,
    };
  }

  if (skip) readyForReading = true;

  if (readyForReading && looksLikeReading(assistantText)) {
    nextField = null;
  }

  return {
    assistantText,
    source: ai.source,
    showMockBadge: ai.showMockBadge,
    traits,
    birthTime,
    readyForReading,
    nextField,
  };
}

function looksLikeReading(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('tử vi ngày') ||
    t.includes('tổng quan') ||
    t.includes('công việc') ||
    t.length > 280
  );
}
