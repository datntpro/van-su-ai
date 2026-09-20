/**
 * Chọn ngày tốt theo việc — heuristic lịch vạn sự (giải trí).
 * Combines dayQuality + birth-year animal vs day Chi personalization.
 */

import {
  getDayFortune,
  type DayFortune,
  type SolarDate,
} from '@/src/lib/calendar';
import {
  chiRelation,
  dayChiFromCanChi,
  type ChiRelation,
} from '@/src/lib/personalizedFortune';
import { yearAnimal } from '@/src/lib/profile';

export type EventTypeId =
  | 'cuoi_hoi'
  | 'khai_truong'
  | 'dong_tho'
  | 'xuat_hanh'
  | 'ky_hop_dong'
  | 'nhap_trach'
  | 'an_vi'
  | 'cau_tai'
  | 'sua_nha'
  | 'nhan_viec'
  | 'cau_duyen'
  | 'mua_xe';

export type EventType = {
  id: EventTypeId;
  label: string;
  emoji: string;
  blurb: string;
  /** Preferred day qualities (ordered). */
  preferQuality: Array<DayFortune['dayQuality']>;
  /** Prefer hop over xung when profile exists. */
  preferHop: boolean;
};

export const EVENT_TYPES: EventType[] = [
  {
    id: 'cuoi_hoi',
    label: 'Cưới hỏi',
    emoji: '💍',
    blurb: 'Lễ hỏi / cưới — ưu tiên ngày tốt, hợp tuổi.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'khai_truong',
    label: 'Khai trương',
    emoji: '🏪',
    blurb: 'Mở cửa hàng / văn phòng mới.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'dong_tho',
    label: 'Động thổ',
    emoji: '🏗️',
    blurb: 'Khởi công xây dựng, móng nhà.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'xuat_hanh',
    label: 'Xuất hành',
    emoji: '🧳',
    blurb: 'Đi xa, công tác, du lịch.',
    preferQuality: ['tot', 'binh'],
    preferHop: false,
  },
  {
    id: 'ky_hop_dong',
    label: 'Ký hợp đồng',
    emoji: '📝',
    blurb: 'Ký kết, thỏa thuận quan trọng.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'nhap_trach',
    label: 'Nhập trạch',
    emoji: '🏠',
    blurb: 'Chuyển vào nhà mới.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'an_vi',
    label: 'An vị bàn thờ',
    emoji: '🕯️',
    blurb: 'An vị / thờ cúng.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'cau_tai',
    label: 'Cầu tài',
    emoji: '💰',
    blurb: 'Khai trương tài vận, mở hàng (giải trí).',
    preferQuality: ['tot', 'binh'],
    preferHop: false,
  },
  {
    id: 'sua_nha',
    label: 'Sửa nhà',
    emoji: '🔧',
    blurb: 'Sửa chữa, cải tạo nhà cửa.',
    preferQuality: ['tot', 'binh'],
    preferHop: false,
  },
  {
    id: 'nhan_viec',
    label: 'Nhận việc',
    emoji: '💼',
    blurb: 'Nhận việc mới / nhậm chức.',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'cau_duyen',
    label: 'Cầu duyên',
    emoji: '💕',
    blurb: 'Hẹn hò / cầu duyên (giải trí).',
    preferQuality: ['tot', 'binh'],
    preferHop: true,
  },
  {
    id: 'mua_xe',
    label: 'Mua xe',
    emoji: '🚗',
    blurb: 'Nhận xe / đăng ký xe mới.',
    preferQuality: ['tot', 'binh'],
    preferHop: false,
  },
];

export function getEventType(id: EventTypeId): EventType {
  return EVENT_TYPES.find((e) => e.id === id) ?? EVENT_TYPES[0];
}

export type GoodDayCandidate = {
  solar: SolarDate;
  iso: string;
  fortune: DayFortune;
  score: number;
  reasons: string[];
  chiRelation: ChiRelation | null;
  yearAnimal: string | null;
};

export type RecommendGoodDaysParams = {
  eventId: EventTypeId;
  /** Inclusive start (default: today local). */
  from?: Date;
  /** Number of days to scan (default 60, clamp 14–120). */
  rangeDays?: number;
  /** Birth date YYYY-MM-DD for animal personalization. */
  birthDate?: string | null;
  /** Max results (default 12). */
  limit?: number;
};

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${pad(m)}-${pad(day)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Score a day for an event. Higher = better recommendation.
 * Heuristic only — entertainment disclaimer required in UI.
 */
export function scoreDayForEvent(
  date: Date,
  event: EventType,
  birthDate?: string | null,
): Omit<GoodDayCandidate, 'iso'> {
  const fortune = getDayFortune(date);
  const solar = fortune.solar;
  const reasons: string[] = [];
  let score = 0;

  const q = fortune.dayQuality;
  if (q === 'tot') {
    score += 40;
    reasons.push('Ngày tốt (heuristic lịch)');
  } else if (q === 'binh') {
    score += 18;
    reasons.push('Ngày bình thường');
  } else {
    score -= 25;
    reasons.push('Ngày xấu — nên tránh nếu có lựa chọn khác');
  }

  const goodHours = fortune.hoangDaoHours.filter((h) => h.good).length;
  score += Math.min(12, goodHours);
  if (goodHours >= 6) reasons.push(`Nhiều giờ hoàng đạo (${goodHours})`);

  let relation: ChiRelation | null = null;
  let animal: string | null = null;
  if (birthDate && /^\d{4}-\d{2}-\d{2}/.test(birthDate)) {
    animal = yearAnimal(birthDate);
    const dayChi = dayChiFromCanChi(fortune.canChiDay);
    relation = chiRelation(animal, dayChi);
    if (relation === 'hop') {
      score += event.preferHop ? 28 : 18;
      reasons.push(`Tuổi ${animal} hợp ngày ${dayChi}`);
    } else if (relation === 'xung') {
      score -= event.preferHop ? 30 : 18;
      reasons.push(`Tuổi ${animal} xung ngày ${dayChi}`);
    } else {
      score += 4;
      reasons.push(`Tuổi ${animal} · ngày ${dayChi}`);
    }
  }

  // Mild event-specific nudges (demo)
  const jdChi = (fortune.canChiDay.split(/\s+/).pop() ?? '') as string;
  if (event.id === 'xuat_hanh' && ['Dần', 'Mão', 'Thân'].includes(jdChi)) {
    score += 6;
    reasons.push('Chi ngày thuận xuất hành (gợi ý)');
  }
  if (event.id === 'cuoi_hoi' && relation === 'hop') {
    score += 4;
  }
  if (event.id === 'cau_tai' && q === 'tot') {
    score += 4;
  }

  // Prefer quality list order
  const prefIdx = event.preferQuality.indexOf(q);
  if (prefIdx === 0) score += 6;
  else if (prefIdx < 0) score -= 8;

  return {
    solar,
    fortune,
    score,
    reasons,
    chiRelation: relation,
    yearAnimal: animal,
  };
}

export function recommendGoodDays(
  params: RecommendGoodDaysParams,
): GoodDayCandidate[] {
  const event = getEventType(params.eventId);
  const from = startOfLocalDay(params.from ?? new Date());
  const range = Math.min(120, Math.max(14, params.rangeDays ?? 60));
  const limit = Math.min(30, Math.max(3, params.limit ?? 12));

  const out: GoodDayCandidate[] = [];
  for (let i = 0; i < range; i += 1) {
    const d = addDays(from, i);
    const scored = scoreDayForEvent(d, event, params.birthDate);
    out.push({
      ...scored,
      iso: toIso(d),
    });
  }

  out.sort((a, b) => b.score - a.score || a.iso.localeCompare(b.iso));

  // Prefer non-xau when possible: take top by score (already sorted)
  const filtered = out.filter((c) => c.fortune.dayQuality !== 'xau' || c.score >= 20);
  const pool = filtered.length >= Math.min(5, limit) ? filtered : out;
  return pool.slice(0, limit);
}

/** Convenience: quality label for chips */
export function qualityColorKey(
  q: DayFortune['dayQuality'],
): 'tot' | 'xau' | 'binh' {
  return q;
}

export function formatCandidateDate(c: GoodDayCandidate): string {
  const { day, month, year } = c.solar;
  return `${pad(day)}/${pad(month)}/${year}`;
}
