import type { UserProfile } from './profile';
import { zodiacFromBirthDate, yearAnimal } from './profile';
import { getDayFortune } from './calendar';
import { callAi, type AiResult } from './ai';
import type { UserTraits } from './traits';
import { DISCLAIMER } from '@/src/theme/colors';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  source?: 'api' | 'mock';
  showMockBadge?: boolean;
};

const REPLIES = [
  (q: string, profile: UserProfile) => {
    const sign = zodiacFromBirthDate(profile.birthDate);
    return `Với cung ${sign} của bạn, câu hỏi “${truncate(q)}” gợi ý nên lắng nghe trực giác nhưng vẫn kiểm chứng bằng dữ liệu thực tế. Hôm nay nên ưu tiên việc nhỏ hoàn thành sớm.`;
  },
  (q: string, profile: UserProfile) => {
    const animal = yearAnimal(profile.birthDate);
    const f = getDayFortune();
    return `Tuổi ${animal} · ngày ${f.canChiDay}: năng lượng ${f.dayQualityLabel.toLowerCase()}. Về “${truncate(q)}”, hãy chọn một hành động cụ thể trong 24 giờ tới thay vì suy nghĩ lan man.`;
  },
  (_q: string, _profile: UserProfile) =>
    'Mình hiểu bạn đang tìm hướng đi. Hãy viết ra 3 lựa chọn, chấm điểm theo tiêu chí cảm xúc / lý trí / nguồn lực — đáp án thường hiện rõ sau bước này.',
  (q: string) =>
    `Câu hỏi thú vị: “${truncate(q)}”. Trong khung giải trí vạn sự, đây là lúc giữ tâm thế trung dung — không vội vàng cũng không trì hoãn quá lâu.`,
];

function truncate(s: string, n = 48): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Chat reply via pluggable AI or improved mock. Always includes disclaimer. */
export async function chatReply(
  question: string,
  profile: UserProfile,
  traits?: UserTraits,
): Promise<AiResult> {
  const ai = await callAi({
    type: 'chat',
    profile,
    traits,
    message: question,
  });
  if (ai.text) return ai;

  await new Promise((r) => setTimeout(r, 600));
  const idx = Math.abs(hash(question + profile.birthDate)) % REPLIES.length;
  const fn = REPLIES[idx]!;
  const body = fn(question, profile);
  const extra =
    traits?.career || traits?.concerns?.length
      ? ` (gợi từ hồ sơ: ${[traits.career, ...(traits.concerns ?? [])].filter(Boolean).join(', ')})`
      : '';
  return {
    text: `${body}${extra}\n\n— ${DISCLAIMER} —`,
    source: 'mock',
    showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
  };
}

/** @deprecated Use chatReply */
export async function mockChatReply(
  question: string,
  profile: UserProfile,
): Promise<string> {
  const r = await chatReply(question, profile);
  return r.text;
}
