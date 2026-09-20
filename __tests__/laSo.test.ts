import {
  buildLaSoPillars,
  chiFromBirthTime,
  getCanChiHour,
} from '../src/lib/laSo';
import type { UserProfile } from '../src/lib/profile';

describe('lá số pillars', () => {
  const profile: UserProfile = {
    birthDate: '2016-08-15', // Bính Thân year animal
    birthTime: '08:30',
    displayName: 'Dat',
    createdAt: new Date().toISOString(),
  };

  it('builds year/month/day can chi from birth date (not “today”)', () => {
    const p = buildLaSoPillars(profile);
    expect(p).not.toBeNull();
    expect(p!.yearAnimal).toBe('Thân');
    expect(p!.year).toBe('Bính Thân');
    expect(p!.day).toMatch(
      /^(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý) (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)$/,
    );
    expect(p!.lunarLabel).toMatch(/ngày \d+ tháng \d+/);
    expect(p!.hour).toBeTruthy();
  });

  it('chiFromBirthTime maps morning to Thìn-ish window', () => {
    expect(chiFromBirthTime('08:30')).toBe('Thìn');
    expect(chiFromBirthTime('00:30')).toBe('Tý');
    expect(chiFromBirthTime('bad')).toBeNull();
  });

  it('getCanChiHour returns can+chi when time present', () => {
    const h = getCanChiHour('2016-08-15', '08:30');
    expect(h).toMatch(
      /^(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý) (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)$/,
    );
  });
});
