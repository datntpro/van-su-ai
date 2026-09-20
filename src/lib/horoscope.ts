import type { UserProfile } from './profile';
import { yearAnimal, zodiacFromBirthDate } from './profile';
import { getDayFortune } from './calendar';
import { callAi, type AiResult } from './ai';
import { EMPTY_TRAITS, traitsSummaryLines, type UserTraits } from './traits';

/**
 * Generate Vietnamese daily horoscope (personalized when traits present).
 * Uses EXPO_PUBLIC_AI_API_URL when configured; else improved mock.
 */
export async function generateDailyHoroscope(
  profile: UserProfile,
  date: Date = new Date(),
  traits: UserTraits = EMPTY_TRAITS,
): Promise<AiResult> {
  const ai = await callAi({
    type: 'horoscope',
    profile,
    traits,
    date: date.toISOString(),
  });
  if (ai.text) return ai;

  const fortune = getDayFortune(date);
  const sign = zodiacFromBirthDate(profile.birthDate);
  const animal = yearAnimal(profile.birthDate);
  const name = profile.displayName?.trim() || 'bạn';
  const tone =
    fortune.dayQuality === 'tot'
      ? 'tươi sáng'
      : fortune.dayQuality === 'xau'
        ? 'cần giữ vững'
        : 'ổn định';

  const extras = traitsSummaryLines(profile.birthTime, traits);
  const genderHint = traits.gender ? ` (${traits.gender})` : '';
  const careerLine = traits.career
    ? `Với công việc “${traits.career}”, `
    : '';
  const loveLine = traits.relationshipStatus
    ? `Tình trạng “${traits.relationshipStatus}” gợi ý `
    : '';
  const concernLine = traits.concerns.length
    ? `Bạn đang để tâm tới ${traits.concerns.join(', ')} — `
    : '';
  const goal = traits.questionnaire.year_goal;
  const goalLine =
    typeof goal === 'string' && goal.trim()
      ? `Mục tiêu năm nay (“${goal}”) nên chia thành việc nhỏ hoàn thành trong tuần.`
      : 'Chọn một việc nhỏ hoàn thành trước 12h sẽ tạo đà tốt.';
  const place = traits.locationCurrent
    ? ` Năng lượng nơi bạn đang ở (${traits.locationCurrent}) nên được cân bằng bằng đi bộ ngắn.`
    : '';

  const text = [
    `✦ Tử vi ngày ${fortune.solar.day}/${fortune.solar.month}/${fortune.solar.year} dành cho ${name}${genderHint}`,
    ``,
    `Cung ${sign} · Tuổi ${animal} · Can Chi ngày: ${fortune.canChiDay}`,
    extras.length ? `Hồ sơ: ${extras.join(' · ')}` : '',
    extras.length ? '' : '',
    `Tổng quan: Ngày mang sắc thái ${tone}. ${fortune.summary} ${concernLine}hãy giữ nhịp thở chậm khi quyết định.`,
    ``,
    `Công việc: ${careerLine}${
      fortune.dayQuality === 'tot'
        ? 'Dễ nhận tín hiệu tích cực từ đồng nghiệp. Nên đề xuất ý tưởng sớm trong ngày.'
        : fortune.dayQuality === 'xau'
          ? 'Tránh quyết định vội. Kiểm tra lại email và lịch họp trước khi cam kết.'
          : 'Hoàn thành việc đang làm sẽ mang lại cảm giác kiểm soát tốt.'
    }`,
    ``,
    `Tình cảm: ${loveLine}${
      profile.birthTime
        ? `Giờ sinh ${profile.birthTime} gợi ý bạn nên lắng nghe nhiều hơn nói.`
        : 'Dành thời gian chất lượng cho người thân sẽ giúp cân bằng năng lượng.'
    }`,
    ``,
    `Tài lộc: ${
      fortune.dayQuality === 'tot'
        ? 'Có cơ hội nhỏ bất ngờ — đừng bỏ lỡ tin nhắn hoặc ưu đãi trong ngày.'
        : 'Chi tiêu có kế hoạch; tránh vay mượn không cần thiết.'
    }`,
    ``,
    `Sức khỏe: Uống đủ nước, nghỉ mắt sau mỗi 1–2 giờ làm việc.${place}`,
    ``,
    `Lời khuyên: ${goalLine} Chọn giờ hoàng đạo ${fortune.hoangDaoHours
      .filter((h) => h.good)
      .slice(0, 2)
      .map((h) => h.name)
      .join(', ')} nếu cần xuất hành.`,
    ``,
    `— Van Su AI —`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');

  return {
    text,
    source: 'mock',
    showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
  };
}
