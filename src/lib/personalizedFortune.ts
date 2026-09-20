/**
 * Personalized day fortune from birthDate (+ optional traits).
 * Entertainment only — heuristic, not professional advice.
 */

import {
  getCanChiDay,
  getDayFortune,
  getDayQuality,
  solarToLunar,
  type DayFortune,
} from '@/src/lib/calendar';
import { yearAnimal, zodiacFromBirthDate } from '@/src/lib/profile';
import type { UserTraits } from '@/src/lib/traits';

const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;

export type PersonalizationInput = {
  birthDate: string; // YYYY-MM-DD
  displayName?: string;
  traits?: Pick<
    UserTraits,
    'career' | 'concerns' | 'gender' | 'relationshipStatus' | 'questionnaire'
  >;
};

export type ChiRelation = 'hop' | 'xung' | 'binh';

export type PersonalizedDayFortune = DayFortune & {
  personalized: boolean;
  ageYears: number | null;
  yearAnimal: string | null;
  westernZodiac: string | null;
  dayChi: string;
  chiRelation: ChiRelation;
  chiRelationLabel: string;
  /** Full personalized (or generic) summary */
  summary: string;
  /** Short line for home widgets (~40–60 chars) */
  widgetSummary: string;
};

function chiIndex(name: string): number {
  return CHI.indexOf(name as (typeof CHI)[number]);
}

/** Extract day Chi from "Can Chi" string. */
export function dayChiFromCanChi(canChiDay: string): string {
  const parts = canChiDay.trim().split(/\s+/);
  return parts[parts.length - 1] ?? '';
}

/**
 * Year-animal vs day-Chi relation (demo heuristic).
 * Lục hợp → hop; lục xung → xung; else binh.
 */
export function chiRelation(yearAnimalName: string, dayChiName: string): ChiRelation {
  const a = chiIndex(yearAnimalName);
  const b = chiIndex(dayChiName);
  if (a < 0 || b < 0) return 'binh';
  // Lục xung: opposite (+6)
  if ((a + 6) % 12 === b) return 'xung';
  // Lục hợp pairs
  const hopPairs: [number, number][] = [
    [0, 1], // Tý–Sửu
    [2, 11], // Dần–Hợi
    [3, 10], // Mão–Tuất
    [4, 9], // Thìn–Dậu
    [5, 8], // Tỵ–Thân
    [6, 7], // Ngọ–Mùi
  ];
  for (const [x, y] of hopPairs) {
    if ((a === x && b === y) || (a === y && b === x)) return 'hop';
  }
  // Tam hợp groups (soft hop)
  const tamHop = [
    [0, 4, 8], // Tý Thìn Thân
    [1, 5, 9],
    [2, 6, 10],
    [3, 7, 11],
  ];
  for (const g of tamHop) {
    if (g.includes(a) && g.includes(b) && a !== b) return 'hop';
  }
  return 'binh';
}

export function ageFromBirthDate(iso: string, on: Date = new Date()): number {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  let age = on.getFullYear() - y;
  const md = on.getMonth() + 1;
  const dd = on.getDate();
  if (md < m || (md === m && dd < d)) age -= 1;
  return Math.max(0, age);
}

function relationLabel(r: ChiRelation, animal: string, dayChi: string): string {
  // "Tuổi X" = con giáp năm sinh của user — không phải năm âm lịch của ngày đang xem
  if (r === 'hop') return `Tuổi ${animal} (năm sinh) hợp ngày ${dayChi}`;
  if (r === 'xung') return `Tuổi ${animal} (năm sinh) xung ngày ${dayChi}`;
  return `Tuổi ${animal} (năm sinh) · ngày ${dayChi}`;
}

function traitSnippet(
  traits: PersonalizationInput['traits'] | undefined,
): string | null {
  if (!traits) return null;
  if (traits.career?.trim()) return `Công việc (${traits.career.trim()})`;
  if (traits.concerns?.length) return `Quan tâm: ${traits.concerns[0]}`;
  const goal = traits.questionnaire?.year_goal;
  if (typeof goal === 'string' && goal.trim()) return `Mục tiêu: ${goal.trim()}`;
  if (traits.relationshipStatus?.trim()) {
    return `Tình cảm (${traits.relationshipStatus.trim()})`;
  }
  return null;
}

function buildPersonalizedSummary(opts: {
  quality: DayFortune['dayQuality'];
  name?: string;
  animal: string;
  dayChi: string;
  relation: ChiRelation;
  age: number;
  zodiac: string;
  trait: string | null;
}): { summary: string; widgetSummary: string } {
  const who = opts.name?.trim() ? opts.name.trim() : 'Bạn';
  const ageBit = `${opts.age} tuổi`;
  const traitBit = opts.trait ? ` · ${opts.trait}` : '';

  let core: string;
  if (opts.relation === 'hop') {
    if (opts.quality === 'tot') {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) hôm nay hợp ngày ${opts.dayChi}: khí vận thuận, nên chủ động việc mới.`;
    } else if (opts.quality === 'xau') {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) hợp ngày ${opts.dayChi} nhưng ngày hơi khắc — làm việc nhỏ, tránh quyết định lớn.`;
    } else {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) hợp ngày ${opts.dayChi}: giữ nhịp ổn, tận dụng mối quan hệ gần.`;
    }
  } else if (opts.relation === 'xung') {
    if (opts.quality === 'tot') {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) xung ngày ${opts.dayChi}: ngày tốt chung nhưng nên tránh xung đột, ưu tiên lắng nghe.`;
    } else if (opts.quality === 'xau') {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) xung ngày ${opts.dayChi}: nên chậm lại, hoàn thiện việc cũ, hạn chế ký kết.`;
    } else {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) xung ngày ${opts.dayChi}: bình tĩnh, tránh tranh cãi; chăm sức khỏe.`;
    }
  } else {
    if (opts.quality === 'tot') {
      core = `${who} (${ageBit}, cung ${opts.zodiac}, tuổi ${opts.animal}) — ngày ${opts.dayChi} thuận: xuất hành / gặp gỡ ổn.`;
    } else if (opts.quality === 'xau') {
      core = `${who} (${ageBit}, tuổi ${opts.animal}) — ngày ${opts.dayChi} cần thận trọng; ưu tiên hoàn thiện việc dang dở.`;
    } else {
      core = `${who} (${ageBit}, cung ${opts.zodiac}, tuổi ${opts.animal}) — ngày ${opts.dayChi} ổn định; giữ nhịp đều.`;
    }
  }

  const summary = `${core}${traitBit}.`;
  const widgetSummary =
    opts.relation === 'hop'
      ? `${opts.animal} hợp ${opts.dayChi} · ${ageBit}`
      : opts.relation === 'xung'
        ? `${opts.animal} xung ${opts.dayChi} · cẩn thận`
        : `${opts.animal} · ngày ${opts.dayChi} · ${ageBit}`;

  return { summary, widgetSummary };
}

/**
 * Day fortune; when birthDate present, summary/widgetSummary are personalized
 * and differ across users/days. Without birthDate → generic getDayFortune text.
 */
export function getPersonalizedDayFortune(
  date: Date = new Date(),
  person?: PersonalizationInput | null,
): PersonalizedDayFortune {
  const base = getDayFortune(date);
  const dayChi = dayChiFromCanChi(base.canChiDay);

  if (!person?.birthDate) {
    return {
      ...base,
      personalized: false,
      ageYears: null,
      yearAnimal: null,
      westernZodiac: null,
      dayChi,
      chiRelation: 'binh',
      chiRelationLabel: `Ngày ${dayChi}`,
      widgetSummary: base.summary.slice(0, 48),
    };
  }

  const animal = yearAnimal(person.birthDate);
  const zodiac = zodiacFromBirthDate(person.birthDate);
  const age = ageFromBirthDate(person.birthDate, date);
  const relation = chiRelation(animal, dayChi);
  const trait = traitSnippet(person.traits);
  const { summary, widgetSummary } = buildPersonalizedSummary({
    quality: base.dayQuality,
    name: person.displayName,
    animal,
    dayChi,
    relation,
    age,
    zodiac,
    trait,
  });

  return {
    ...base,
    summary,
    personalized: true,
    ageYears: age,
    yearAnimal: animal,
    westernZodiac: zodiac,
    dayChi,
    chiRelation: relation,
    chiRelationLabel: relationLabel(relation, animal, dayChi),
    widgetSummary,
  };
}

/** Month-grid cell data (solar + lunar day number + quality). */
export type MonthCell = {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  lunarDay: number;
  lunarMonth: number;
  lunarLeap: boolean;
  inCurrentMonth: boolean;
  isToday: boolean;
  dayQuality: DayFortune['dayQuality'];
  canChiDay: string;
};

export type MonthGrid = {
  year: number;
  month: number; // 1–12
  /** Sunday-first weeks (7 columns), padded to full weeks */
  cells: MonthCell[];
};

export function buildMonthGrid(
  year: number,
  month: number,
  today: Date = new Date(),
): MonthGrid {
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();

  const cells: MonthCell[] = [];

  const pushDay = (y: number, m: number, d: number, inCurrent: boolean) => {
    const lunar = solarToLunar(d, m, y);
    cells.push({
      solarYear: y,
      solarMonth: m,
      solarDay: d,
      lunarDay: lunar.day,
      lunarMonth: lunar.month,
      lunarLeap: lunar.leap,
      inCurrentMonth: inCurrent,
      isToday: y === ty && m === tm && d === td,
      dayQuality: getDayQuality(d, m, y),
      canChiDay: getCanChiDay(d, m, y),
    });
  };

  for (let i = startPad - 1; i >= 0; i--) {
    let m = month - 1;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    pushDay(y, m, prevMonthDays - i, false);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    pushDay(year, month, d, true);
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1]!;
    let m = last.solarMonth;
    let y = last.solarYear;
    let d = last.solarDay + 1;
    const dim = new Date(y, m, 0).getDate();
    if (d > dim) {
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    pushDay(y, m, d, false);
    if (cells.length >= 42) break;
  }

  return { year, month, cells };
}

export const WEEKDAY_LABELS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}
