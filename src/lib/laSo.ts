/**
 * Lá số tử vi (tóm tắt giải trí) từ hồ sơ + traits.
 * Không lưu privileged data; chỉ dựng text từ profile/traits đã có.
 */
import {
  getCanChiDay,
  getCanChiMonth,
  getCanChiYear,
  solarToLunar,
} from '@/src/lib/calendar';
import { yearAnimal, zodiacFromBirthDate, type UserProfile } from '@/src/lib/profile';
import { callAi } from '@/src/lib/ai';
import {
  countFilledExtras,
  EMPTY_TRAITS,
  traitsSummaryLines,
  type UserTraits,
} from '@/src/lib/traits';

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
const CHI = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ',
  'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
] as const;

const NGU_HANH_CAN: Record<string, string> = {
  Giáp: 'Mộc', Ất: 'Mộc',
  Bính: 'Hỏa', Đinh: 'Hỏa',
  Mậu: 'Thổ', Kỷ: 'Thổ',
  Canh: 'Kim', Tân: 'Kim',
  Nhâm: 'Thủy', Quý: 'Thủy',
};

/** Giờ địa chi từ HH:mm (ước lượng 2 giờ/chi). */
export function chiFromBirthTime(hhmm?: string): string | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null;
  const [hs, ms] = hhmm.trim().split(':').map(Number);
  if (hs == null || ms == null || hs > 23 || ms > 59) return null;
  // Tý starts at 23:00
  const totalMin = hs * 60 + ms;
  const shifted = (totalMin + 60) % (24 * 60); // map 23:00→0
  const idx = Math.floor(shifted / 120) % 12;
  return CHI[idx] ?? null;
}

export function getCanChiHour(birthDate: string, birthTime?: string): string | null {
  const chi = chiFromBirthTime(birthTime);
  if (!chi) return null;
  const y = Number(birthDate.slice(0, 4));
  const m = Number(birthDate.slice(5, 7));
  const d = Number(birthDate.slice(8, 10));
  if (!y || !m || !d) return null;
  const dayCan = getCanChiDay(d, m, y).split(/\s+/)[0] ?? 'Giáp';
  // Can giờ theo can ngày (bảng cổ điển)
  const dayCanIdx = CAN.indexOf(dayCan as (typeof CAN)[number]);
  const hourChiIdx = CHI.indexOf(chi as (typeof CHI)[number]);
  if (dayCanIdx < 0 || hourChiIdx < 0) return `${chi}`;
  const startCan = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8][dayCanIdx] ?? 0; // Giáp/Kỷ→Giáp…
  const canIdx = (startCan + hourChiIdx) % 10;
  return `${CAN[canIdx]} ${chi}`;
}

export type LaSoPillars = {
  year: string;
  month: string;
  day: string;
  hour: string | null;
  lunarLabel: string;
  nguHanhYear: string;
  westernZodiac: string;
  yearAnimal: string;
};

export function buildLaSoPillars(profile: UserProfile): LaSoPillars | null {
  if (!profile.birthDate) return null;
  const y = Number(profile.birthDate.slice(0, 4));
  const m = Number(profile.birthDate.slice(5, 7));
  const d = Number(profile.birthDate.slice(8, 10));
  if (!y || !m || !d) return null;
  const lunar = solarToLunar(d, m, y);
  const yearCC = getCanChiYear(lunar.year);
  const canYear = yearCC.split(/\s+/)[0] ?? '';
  return {
    year: yearCC,
    month: getCanChiMonth(lunar.month, lunar.year),
    day: getCanChiDay(d, m, y),
    hour: getCanChiHour(profile.birthDate, profile.birthTime),
    lunarLabel: `ngày ${lunar.day} tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${yearCC}`,
    nguHanhYear: NGU_HANH_CAN[canYear] ?? '—',
    westernZodiac: zodiacFromBirthDate(profile.birthDate),
    yearAnimal: yearAnimal(profile.birthDate),
  };
}

/** Profile đủ để mở lá số: có ngày sinh (+ ideally giờ / vài traits). */
export function canOpenLaSo(
  profile: UserProfile | null | undefined,
  traits: UserTraits = EMPTY_TRAITS,
): boolean {
  if (!profile?.birthDate) return false;
  // Prefer birth time OR enough traits; still allow with birth date alone
  return true;
}

export function hasRichLaSoContext(
  profile: UserProfile,
  traits: UserTraits,
): boolean {
  return Boolean(profile.birthTime) || countFilledExtras(profile.birthTime, traits) >= 2;
}

function localLaSoTemplate(
  profile: UserProfile,
  traits: UserTraits,
  pillars: LaSoPillars,
  full: boolean,
): string {
  const name = profile.displayName?.trim() || 'Bạn';
  const extras = traitsSummaryLines(profile.birthTime, traits);
  const hourLine = pillars.hour
    ? `Giờ: ${pillars.hour}`
    : 'Giờ: chưa có (thêm giờ sinh để luận trụ giờ)';

  const header = [
    `✦ Lá số tử vi · ${name}`,
    ``,
    `Âm lịch lúc sinh: ${pillars.lunarLabel}`,
    `Năm: ${pillars.year} · Tháng: ${pillars.month}`,
    `Ngày: ${pillars.day} · ${hourLine}`,
    `Ngũ hành năm (ước lượng): ${pillars.nguHanhYear}`,
    `Cung Tây: ${pillars.westernZodiac} · Tuổi/con giáp năm sinh: ${pillars.yearAnimal}`,
    extras.length ? `Hồ sơ: ${extras.join(' · ')}` : '',
  ].filter(Boolean);

  if (!full) {
    return [
      ...header,
      ``,
      `Tóm tắt nhanh: Khí ${pillars.nguHanhYear.toLowerCase()} của năm ${pillars.year} gợi nhịp ổn định — nên giữ kế hoạch nhỏ, rõ ràng.`,
      `Nâng Pro để xem cục diện đầy đủ (tài / lộc / tình / sức khỏe).`,
    ].join('\n');
  }

  const career = traits.career?.trim();
  const love = traits.relationshipStatus?.trim();
  const concerns = traits.concerns?.length ? traits.concerns.join(', ') : '';
  const goal =
    typeof traits.questionnaire?.year_goal === 'string'
      ? traits.questionnaire.year_goal.trim()
      : '';

  return [
    ...header,
    ``,
    `— Cục diện (ước lượng, giải trí) —`,
    `Tài / lộc: Năm ${pillars.year} (${pillars.nguHanhYear}) — ưu tiên tích lũy đều; tránh mạo hiểm lớn khi chưa có thông tin giờ sinh đầy đủ.`,
    `Sự nghiệp: ${career ? `Với “${career}”, ` : ''}nên chọn việc có lộ trình rõ trong 3–6 tháng tới.`,
    `Tình cảm: ${love ? `Trạng thái “${love}” — ` : ''}lắng nghe và giữ biên giới lành mạnh.`,
    `Sức khỏe: Cân bằng nghỉ ngơi; ngũ hành ${pillars.nguHanhYear} gợi chú ý chế độ ngủ và vận động nhẹ.`,
    concerns ? `Đang quan tâm: ${concerns} — hãy chọn 1 việc cụ thể trong tuần này.` : '',
    goal ? `Mục tiêu năm: “${goal}” — chia thành cột mốc tháng.` : '',
    ``,
    `Lời khuyên: Đây là lá số tóm tắt theo can chi lúc sinh + hồ sơ — không thay thế luận bàn chuyên sâu.`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}

/**
 * Build lá số text. Uses AI worker when configured; else local template.
 * `full` = Pro/trial; free short overview.
 */
export async function generateLaSo(opts: {
  profile: UserProfile;
  traits?: UserTraits;
  full: boolean;
}): Promise<{ text: string; source: 'api' | 'mock'; showMockBadge: boolean }> {
  const traits = opts.traits ?? EMPTY_TRAITS;
  const pillars = buildLaSoPillars(opts.profile);
  if (!pillars) {
    return {
      text: 'Chưa có ngày sinh — hãy hoàn tất hồ sơ để xem lá số.',
      source: 'mock',
      showMockBadge: false,
    };
  }

  if (opts.full) {
    const ai = await callAi({
      type: 'horoscope',
      profile: opts.profile,
      traits,
      message: `Viết LÁ SỐ TỬ VI (natal overview) tiếng Việt cho người này: tóm tắt can chi năm/tháng/ngày/giờ (nếu có), ngũ hành ước lượng, cục diện tài/lộc/tình/sức khỏe. Năm ${pillars.year}, tháng ${pillars.month}, ngày ${pillars.day}, giờ ${pillars.hour ?? 'chưa có'}. Không viết tử vi theo ngày hôm nay.`,
    });
    if (ai.text.trim()) {
      return {
        text: ai.text.trim(),
        source: ai.source,
        showMockBadge: ai.showMockBadge,
      };
    }
  }

  return {
    text: localLaSoTemplate(opts.profile, traits, pillars, opts.full),
    source: 'mock',
    showMockBadge: typeof __DEV__ !== 'undefined' && __DEV__,
  };
}
