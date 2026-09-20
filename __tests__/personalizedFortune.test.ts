import {
  ageFromBirthDate,
  buildMonthGrid,
  chiRelation,
  dayChiFromCanChi,
  getPersonalizedDayFortune,
  shiftMonth,
} from '../src/lib/personalizedFortune';
import { getCanChiDay } from '../src/lib/calendar';

describe('personalized day fortune', () => {
  const day = new Date(2026, 8, 13); // 2026-09-13

  it('generic summary when no birthDate', () => {
    const a = getPersonalizedDayFortune(day, null);
    const b = getPersonalizedDayFortune(day, undefined);
    expect(a.personalized).toBe(false);
    expect(b.personalized).toBe(false);
    expect(a.summary).toBe(b.summary);
    expect(a.summary.length).toBeGreaterThan(10);
  });

  it('personalizes differently for two birthDates on the same day', () => {
    const ty = getPersonalizedDayFortune(day, {
      birthDate: '1990-01-15',
      displayName: 'An',
    });
    const suu = getPersonalizedDayFortune(day, {
      birthDate: '1991-06-01',
      displayName: 'Bình',
    });
    expect(ty.personalized).toBe(true);
    expect(suu.personalized).toBe(true);
    expect(ty.yearAnimal).toBe('Ngọ'); // 1990 → Ngọ? (1990+8)%12 = 1998%12=6 → Ngọ yes
    expect(suu.yearAnimal).toBe('Mùi');
    expect(ty.summary).not.toEqual(suu.summary);
    expect(ty.widgetSummary).not.toEqual(suu.widgetSummary);
    expect(ty.summary).toMatch(/An/);
    expect(suu.summary).toMatch(/Bình/);
    expect(ty.ageYears).not.toBeNull();
  });

  it('includes traits snippet when career present', () => {
    const f = getPersonalizedDayFortune(day, {
      birthDate: '1990-01-15',
      displayName: 'An',
      traits: { concerns: [], questionnaire: {}, career: 'thiết kế' },
    });
    expect(f.summary).toMatch(/thiết kế/);
  });

  it('chiRelation detects xung and hop', () => {
    expect(chiRelation('Tý', 'Ngọ')).toBe('xung');
    expect(chiRelation('Tý', 'Sửu')).toBe('hop');
    expect(chiRelation('Tý', 'Mão')).toBe('binh');
  });

  it('dayChiFromCanChi parses day chi', () => {
    const cc = getCanChiDay(13, 9, 2026);
    const chi = dayChiFromCanChi(cc);
    expect(chi).toMatch(/^(Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)$/);
  });

  it('ageFromBirthDate accounts for birthday not yet reached', () => {
    expect(ageFromBirthDate('2000-12-31', new Date(2026, 8, 13))).toBe(25);
    expect(ageFromBirthDate('2000-01-01', new Date(2026, 8, 13))).toBe(26);
  });
});

describe('month grid', () => {
  it('builds a full grid with solar+lunar for Sep 2026', () => {
    const g = buildMonthGrid(2026, 9, new Date(2026, 8, 13));
    expect(g.year).toBe(2026);
    expect(g.month).toBe(9);
    expect(g.cells.length % 7).toBe(0);
    expect(g.cells.length).toBeGreaterThanOrEqual(35);
    const today = g.cells.find((c) => c.isToday);
    expect(today?.solarDay).toBe(13);
    expect(today?.lunarDay).toBe(3);
    const inMonth = g.cells.filter((c) => c.inCurrentMonth);
    expect(inMonth).toHaveLength(30);
  });

  it('shiftMonth crosses year boundary', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 9, 12)).toEqual({ year: 2027, month: 9 });
  });
});
