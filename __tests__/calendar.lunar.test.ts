import {
  formatLunar,
  formatLunarCompact,
  getCanChiDay,
  getCanChiMonth,
  getCanChiYear,
  getHoangDaoHours,
  solarToLunar,
} from '../src/lib/calendar';

describe('lunar golden dates (VN UTC+7)', () => {
  it('2026-09-20 = âm 10/8 năm Bính Ngọ · can chi ngày/tháng Đinh Dậu', () => {
    const lunar = solarToLunar(20, 9, 2026, 7);
    expect(lunar).toEqual({ year: 2026, month: 8, day: 10, leap: false });
    expect(getCanChiYear(lunar.year)).toBe('Bính Ngọ');
    expect(getCanChiDay(20, 9, 2026)).toBe('Đinh Dậu');
    expect(getCanChiMonth(lunar.month, lunar.year)).toBe('Đinh Dậu');
    expect(formatLunar(lunar)).toBe('Âm lịch: ngày 10 tháng 8 năm Bính Ngọ');
    expect(formatLunarCompact(lunar)).toBe('10/8 Bính Ngọ');
  });

  it('Tết 2026 ~ 2026-02-17 = 1/1 Bính Ngọ', () => {
    const lunar = solarToLunar(17, 2, 2026, 7);
    expect(lunar).toEqual({ year: 2026, month: 1, day: 1, leap: false });
    expect(getCanChiYear(lunar.year)).toBe('Bính Ngọ');
    expect(formatLunar(lunar)).toBe('Âm lịch: ngày 1 tháng 1 năm Bính Ngọ');
  });

  it('Tết 2024-02-10 = 1/1 Giáp Thìn', () => {
    const lunar = solarToLunar(10, 2, 2024, 7);
    expect(lunar).toEqual({ year: 2024, month: 1, day: 1, leap: false });
    expect(getCanChiYear(lunar.year)).toBe('Giáp Thìn');
  });

  it('2025-01-29 = Tết Ất Tỵ 1/1', () => {
    const lunar = solarToLunar(29, 1, 2025, 7);
    expect(lunar).toEqual({ year: 2025, month: 1, day: 1, leap: false });
    expect(getCanChiYear(lunar.year)).toBe('Ất Tỵ');
  });

  it('giờ hoàng đạo 2026-09-20 (ngày Dậu) ≈ Tý Dần Mão Ngọ Mùi Dậu', () => {
    const good = getHoangDaoHours(20, 9, 2026)
      .filter((h) => h.good)
      .map((h) => h.name);
    expect(good).toEqual(['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu']);
  });

  it('formatLunar never uses birth-year animal — only lunar year of the day', () => {
    // Birth year Bính Thân (1996) must not appear in day lunar label for 2026-09-20
    const label = formatLunar(solarToLunar(20, 9, 2026, 7));
    expect(label).toContain('Bính Ngọ');
    expect(label).not.toContain('Bính Thân');
    expect(label.startsWith('Âm lịch:')).toBe(true);
  });
});
