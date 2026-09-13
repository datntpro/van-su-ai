/**
 * Personalized AI profile (user_traits) — no entitlement fields.
 */

export type TraitsQuestionnaire = {
  year_goal?: string;
  concerns_text?: string;
  answers?: Record<string, string>;
  [key: string]: unknown;
};

export type UserTraits = {
  gender?: string;
  relationshipStatus?: string;
  career?: string;
  concerns: string[];
  locationCurrent?: string;
  additionalNotes?: string;
  questionnaire: TraitsQuestionnaire;
  updatedAt?: string;
};

export const EMPTY_TRAITS: UserTraits = {
  concerns: [],
  questionnaire: {},
};

export type IntakeFieldId =
  | 'birthTime'
  | 'gender'
  | 'relationshipStatus'
  | 'career'
  | 'concerns'
  | 'yearGoal'
  | 'locationCurrent';

export type IntakeField = {
  id: IntakeFieldId;
  question: string;
  hint?: string;
};

export const INTAKE_FIELDS: IntakeField[] = [
  {
    id: 'birthTime',
    question:
      'Bạn nhớ giờ sinh chi tiết không? (ví dụ 08:30 hoặc “khoảng giờ Thìn”). Nếu không rõ, cứ nói “không nhớ”.',
    hint: 'Giờ sinh giúp luận cung chính xác hơn.',
  },
  {
    id: 'gender',
    question: 'Bạn muốn mình luận theo giới tính nào? (nam / nữ / khác — bạn mô tả giúp mình).',
  },
  {
    id: 'relationshipStatus',
    question: 'Tình trạng hôn nhân / tình cảm hiện tại của bạn thế nào?',
  },
  {
    id: 'career',
    question: 'Bạn đang làm công việc gì, hoặc đang theo đuổi nghề nào?',
  },
  {
    id: 'concerns',
    question: 'Điều bạn đang quan tâm nhất lúc này là gì? (công việc, tình cảm, sức khỏe, tài lộc…)',
  },
  {
    id: 'yearGoal',
    question: 'Mục tiêu lớn của bạn năm nay là gì?',
  },
  {
    id: 'locationCurrent',
    question: 'Bạn đang sống / làm việc ở đâu hiện tại?',
  },
];

export const ENOUGH_CONTEXT_MIN = 3;

export function mergeTraits(base: UserTraits, patch: Partial<UserTraits>): UserTraits {
  return {
    gender: patch.gender ?? base.gender,
    relationshipStatus: patch.relationshipStatus ?? base.relationshipStatus,
    career: patch.career ?? base.career,
    concerns: patch.concerns ?? base.concerns,
    locationCurrent: patch.locationCurrent ?? base.locationCurrent,
    additionalNotes: patch.additionalNotes ?? base.additionalNotes,
    questionnaire: { ...(base.questionnaire ?? {}), ...(patch.questionnaire ?? {}) },
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
}

function filled(s: string | undefined | null): boolean {
  return Boolean(s && s.trim());
}

export function countFilledExtras(
  birthTime: string | undefined,
  traits: UserTraits,
): number {
  let n = 0;
  if (filled(birthTime)) n += 1;
  if (filled(traits.gender)) n += 1;
  if (filled(traits.relationshipStatus)) n += 1;
  if (filled(traits.career)) n += 1;
  if (traits.concerns.length > 0 || filled(traits.questionnaire.concerns_text)) n += 1;
  if (filled(traits.questionnaire.year_goal as string | undefined)) n += 1;
  if (filled(traits.locationCurrent)) n += 1;
  return n;
}

export function hasEnoughContext(
  birthTime: string | undefined,
  traits: UserTraits,
  min = ENOUGH_CONTEXT_MIN,
): boolean {
  return countFilledExtras(birthTime, traits) >= min;
}

export function isFieldFilled(
  id: IntakeFieldId,
  birthTime: string | undefined,
  traits: UserTraits,
): boolean {
  switch (id) {
    case 'birthTime':
      return filled(birthTime);
    case 'gender':
      return filled(traits.gender);
    case 'relationshipStatus':
      return filled(traits.relationshipStatus);
    case 'career':
      return filled(traits.career);
    case 'concerns':
      return traits.concerns.length > 0 || filled(traits.questionnaire.concerns_text);
    case 'yearGoal':
      return filled(traits.questionnaire.year_goal as string | undefined);
    case 'locationCurrent':
      return filled(traits.locationCurrent);
    default:
      return false;
  }
}

export function nextMissingField(
  birthTime: string | undefined,
  traits: UserTraits,
): IntakeField | null {
  for (const f of INTAKE_FIELDS) {
    if (!isFieldFilled(f.id, birthTime, traits)) return f;
  }
  return null;
}

const SKIP_RE = /^(không nhớ|khong nho|skip|bỏ qua|bo qua|không rõ|khong ro|n\/a|na|-)$/i;

export function isSkipAnswer(text: string): boolean {
  return SKIP_RE.test(text.trim());
}

/** Parse HH:mm or H:mm from free text. */
export function extractBirthTime(text: string): string | undefined {
  const m = text.trim().match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!m) return undefined;
  return `${m[1]!.padStart(2, '0')}:${m[2]}`;
}

export function applyAnswerToTraits(
  field: IntakeFieldId,
  raw: string,
  traits: UserTraits,
): { traits: UserTraits; birthTime?: string } {
  const answer = raw.trim();
  if (!answer || isSkipAnswer(answer)) {
    return { traits };
  }

  const next = mergeTraits(traits, {});
  const answers = { ...(next.questionnaire.answers ?? {}), [field]: answer };
  next.questionnaire = { ...next.questionnaire, answers };

  switch (field) {
    case 'birthTime': {
      const t = extractBirthTime(answer);
      return { traits: next, birthTime: t ?? answer };
    }
    case 'gender':
      next.gender = answer;
      break;
    case 'relationshipStatus':
      next.relationshipStatus = answer;
      break;
    case 'career':
      next.career = answer;
      break;
    case 'concerns': {
      const parts = answer
        .split(/[,;|/]/)
        .map((s) => s.trim())
        .filter(Boolean);
      next.concerns = parts.length ? parts : [answer];
      next.questionnaire = { ...next.questionnaire, concerns_text: answer, answers };
      break;
    }
    case 'yearGoal':
      next.questionnaire = { ...next.questionnaire, year_goal: answer, answers };
      break;
    case 'locationCurrent':
      next.locationCurrent = answer;
      break;
    default:
      break;
  }

  return { traits: next };
}

export function traitsSummaryLines(birthTime: string | undefined, traits: UserTraits): string[] {
  const lines: string[] = [];
  if (filled(birthTime)) lines.push(`Giờ sinh: ${birthTime}`);
  if (filled(traits.gender)) lines.push(`Giới tính: ${traits.gender}`);
  if (filled(traits.relationshipStatus)) lines.push(`Tình cảm: ${traits.relationshipStatus}`);
  if (filled(traits.career)) lines.push(`Công việc: ${traits.career}`);
  if (traits.concerns.length) lines.push(`Quan tâm: ${traits.concerns.join(', ')}`);
  const goal = traits.questionnaire.year_goal;
  if (filled(typeof goal === 'string' ? goal : undefined)) lines.push(`Mục tiêu năm nay: ${goal}`);
  if (filled(traits.locationCurrent)) lines.push(`Nơi đang sống: ${traits.locationCurrent}`);
  return lines;
}
