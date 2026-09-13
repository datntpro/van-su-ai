import {
  FIXED_TEST_DATE,
  getCanChiDay,
  getDayFortune,
  getDayQuality,
  solarToLunar,
} from '../src/lib/calendar';

describe('calendar lunar conversion', () => {
  it('converts fixed solar date 2026-09-13 to expected lunar fields', () => {
    const { day, month, year } = FIXED_TEST_DATE;
    const lunar = solarToLunar(day, month, year, 7);

    // Asserted via scripts/assert-calendar.mjs — VN timezone UTC+7
    expect(lunar).toEqual({ year: 2026, month: 8, day: 3, leap: false });
  });

  it('matches known Tết dates', () => {
    expect(solarToLunar(10, 2, 2024, 7)).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      leap: false,
    });
    expect(solarToLunar(29, 1, 2025, 7)).toEqual({
      year: 2025,
      month: 1,
      day: 1,
      leap: false,
    });
  });

  it('returns can chi day string for the fixed date', () => {
    const { day, month, year } = FIXED_TEST_DATE;
    const canChi = getCanChiDay(day, month, year);
    expect(canChi).toMatch(
      /^(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý) (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)$/,
    );
  });

  it('getDayFortune includes hoang dao hours', () => {
    const f = getDayFortune(new Date(2026, 8, 13));
    expect(f.solar).toEqual({ year: 2026, month: 9, day: 13 });
    expect(f.lunar).toEqual({ year: 2026, month: 8, day: 3, leap: false });
    expect(f.hoangDaoHours).toHaveLength(12);
    expect(f.hoangDaoHours.some((h) => h.good)).toBe(true);
    expect(['tot', 'xau', 'binh']).toContain(getDayQuality(13, 9, 2026));
  });
});
