import type { UserProfile } from './profile';
import { yearAnimal, zodiacFromBirthDate } from './profile';
import { getDayFortune } from './calendar';

/**
 * Generate Vietnamese daily horoscope from profile + date (template).
 * Optional mock AI fetch can be wired via EXPO_PUBLIC_MOCK_AI_URL.
 */
export async function generateDailyHoroscope(
  profile: UserProfile,
  date: Date = new Date(),
): Promise<string> {
  const mockUrl = process.env.EXPO_PUBLIC_MOCK_AI_URL;
  if (mockUrl) {
    try {
      const res = await fetch(mockUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'horoscope', profile, date: date.toISOString() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data.text) return data.text;
      }
    } catch {
      // fall through to template
    }
  }

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

  return [
    `✦ Tử vi ngày ${fortune.solar.day}/${fortune.solar.month}/${fortune.solar.year} dành cho ${name}`,
    ``,
    `Cung ${sign} · Tuổi ${animal} · Can Chi ngày: ${fortune.canChiDay}`,
    ``,
    `Tổng quan: Ngày mang sắc thái ${tone}. ${fortune.summary}`,
    ``,
    `Công việc: ${
      fortune.dayQuality === 'tot'
        ? 'Dễ nhận tín hiệu tích cực từ đồng nghiệp. Nên đề xuất ý tưởng sớm trong ngày.'
        : fortune.dayQuality === 'xau'
          ? 'Tránh quyết định vội. Kiểm tra lại email và lịch họp trước khi cam kết.'
          : 'Hoàn thành việc đang làm sẽ mang lại cảm giác kiểm soát tốt.'
    }`,
    ``,
    `Tình cảm: ${
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
    `Sức khỏe: Uống đủ nước, nghỉ mắt sau mỗi 1–2 giờ làm việc.`,
    ``,
    `Lời khuyên: Chọn giờ hoàng đạo ${fortune.hoangDaoHours.filter((h) => h.good).slice(0, 2).map((h) => h.name).join(', ')} nếu cần xuất hành.`,
    ``,
    `— Van Su AI · Chỉ mang tính giải trí —`,
  ].join('\n');
}
