/**
 * Minimal Vietnamese lunar calendar helpers.
 * Solar ↔ lunar conversion adapted from common open algorithms
 * (timezone: Asia/Ho_Chi_Minh, UTC+7).
 */

export type SolarDate = { year: number; month: number; day: number };

export type LunarDate = {
  year: number;
  month: number;
  day: number;
  leap: boolean;
};

export type DayFortune = {
  solar: SolarDate;
  lunar: LunarDate;
  canChiDay: string;
  canChiMonth: string;
  canChiYear: string;
  dayQuality: 'tot' | 'xau' | 'binh';
  dayQualityLabel: string;
  summary: string;
  hoangDaoHours: { name: string; range: string; good: boolean }[];
};

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
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

const HOURS: { name: string; range: string }[] = [
  { name: 'Tý', range: '23:00–01:00' },
  { name: 'Sửu', range: '01:00–03:00' },
  { name: 'Dần', range: '03:00–05:00' },
  { name: 'Mão', range: '05:00–07:00' },
  { name: 'Thìn', range: '07:00–09:00' },
  { name: 'Tỵ', range: '09:00–11:00' },
  { name: 'Ngọ', range: '11:00–13:00' },
  { name: 'Mùi', range: '13:00–15:00' },
  { name: 'Thân', range: '15:00–17:00' },
  { name: 'Dậu', range: '17:00–19:00' },
  { name: 'Tuất', range: '19:00–21:00' },
  { name: 'Hợi', range: '21:00–23:00' },
];

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 +=
    0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltaT =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  const JdNew = Jd1 + C1 - deltaT;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i += 1;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Convert solar (Gregorian) date to Vietnamese lunar date. timeZone default +7. */
export function solarToLunar(
  dd: number,
  mm: number,
  yy: number,
  timeZone = 7,
): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth -= 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    leap: lunarLeap,
  };
}

export function getCanChiYear(year: number): string {
  // Giáp Tý = 1984
  return `${CAN[(year + 6) % 10]} ${CHI[(year + 8) % 12]}`;
}

export function getCanChiMonth(lunarMonth: number, lunarYear: number): string {
  const canIndex = (lunarYear * 12 + lunarMonth + 3) % 10;
  return `${CAN[canIndex]} ${CHI[(lunarMonth + 1) % 12]}`;
}

export function getCanChiDay(dd: number, mm: number, yy: number): string {
  const jd = jdFromDate(dd, mm, yy);
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}

/** Simplified good/bad day from Chi of the day (demo heuristic). */
export function getDayQuality(dd: number, mm: number, yy: number): DayFortune['dayQuality'] {
  const jd = jdFromDate(dd, mm, yy);
  const chi = (jd + 1) % 12;
  // Demo: Tý, Dần, Thìn, Ngọ, Thân, Tuất = tốt; Sửu, Mùi = xấu; còn lại bình
  if ([0, 2, 4, 6, 8, 10].includes(chi)) return 'tot';
  if ([1, 7].includes(chi)) return 'xau';
  return 'binh';
}

export function getHoangDaoHours(dd: number, mm: number, yy: number) {
  const jd = jdFromDate(dd, mm, yy);
  const chiDay = (jd + 1) % 12;
  // Classic mapping: 6 good hours per day based on day Chi
  const goodSets: Record<number, number[]> = {
    0: [0, 1, 4, 5, 8, 9], // Tý
    1: [2, 3, 6, 7, 10, 11],
    2: [0, 1, 4, 5, 8, 9],
    3: [2, 3, 6, 7, 10, 11],
    4: [0, 1, 4, 5, 8, 9],
    5: [2, 3, 6, 7, 10, 11],
    6: [0, 1, 4, 5, 8, 9],
    7: [2, 3, 6, 7, 10, 11],
    8: [0, 1, 4, 5, 8, 9],
    9: [2, 3, 6, 7, 10, 11],
    10: [0, 1, 4, 5, 8, 9],
    11: [2, 3, 6, 7, 10, 11],
  };
  const goods = new Set(goodSets[chiDay] ?? [0, 1, 4, 5, 8, 9]);
  return HOURS.map((h, i) => ({
    name: h.name,
    range: h.range,
    good: goods.has(i),
  }));
}

export function getDayFortune(date: Date = new Date()): DayFortune {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const lunar = solarToLunar(day, month, year);
  const quality = getDayQuality(day, month, year);
  const labels = {
    tot: 'Ngày tốt',
    xau: 'Ngày xấu',
    binh: 'Ngày bình thường',
  } as const;
  const summaries = {
    tot: 'Hôm nay khí vận thuận lợi. Nên bắt đầu việc mới, gặp gỡ đối tác hoặc xuất hành.',
    xau: 'Hôm nay nên thận trọng. Hạn chế ký kết lớn; ưu tiên hoàn thiện việc dang dở.',
    binh: 'Ngày ổn định. Giữ nhịp đều đặn, chăm sức khỏe và quan hệ gần gũi.',
  } as const;

  return {
    solar: { year, month, day },
    lunar,
    canChiDay: getCanChiDay(day, month, year),
    canChiMonth: getCanChiMonth(lunar.month, lunar.year),
    canChiYear: getCanChiYear(lunar.year),
    dayQuality: quality,
    dayQualityLabel: labels[quality],
    summary: summaries[quality],
    hoangDaoHours: getHoangDaoHours(day, month, year),
  };
}

export function formatSolar(d: SolarDate): string {
  return `${pad(d.day)}/${pad(d.month)}/${d.year}`;
}

export function formatLunar(d: LunarDate): string {
  const leap = d.leap ? ' (nhuận)' : '';
  return `${pad(d.day)}/${pad(d.month)}${leap} âm lịch · ${getCanChiYear(d.year)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Fixed assertion helpers for tests */
export const FIXED_TEST_DATE = { day: 13, month: 9, year: 2026 } as const;
