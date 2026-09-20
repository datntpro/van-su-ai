import {
  EVENT_TYPES,
  recommendGoodDays,
  scoreDayForEvent,
  getEventType,
} from '../src/lib/goodDays';

describe('goodDays / chọn ngày tốt', () => {
  it('exposes 8–12 common VN event types', () => {
    expect(EVENT_TYPES.length).toBeGreaterThanOrEqual(8);
    expect(EVENT_TYPES.length).toBeLessThanOrEqual(12);
    expect(EVENT_TYPES.map((e) => e.id)).toEqual(
      expect.arrayContaining([
        'cuoi_hoi',
        'khai_truong',
        'dong_tho',
        'xuat_hanh',
        'ky_hop_dong',
        'nhap_trach',
        'an_vi',
        'cau_tai',
        'sua_nha',
        'nhan_viec',
      ]),
    );
  });

  it('recommendGoodDays returns sorted candidates within range', () => {
    const from = new Date(2026, 8, 20); // 2026-09-20
    const list = recommendGoodDays({
      eventId: 'cuoi_hoi',
      from,
      rangeDays: 30,
      birthDate: '1990-01-15',
      limit: 8,
    });
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThanOrEqual(8);
    for (let i = 1; i < list.length; i += 1) {
      expect(list[i - 1].score).toBeGreaterThanOrEqual(list[i].score);
    }
    expect(list[0].reasons.length).toBeGreaterThan(0);
    expect(list[0].yearAnimal).toBeTruthy();
  });

  it('personalization changes ranking vs anonymous', () => {
    const from = new Date(2026, 8, 20);
    const withBirth = recommendGoodDays({
      eventId: 'cuoi_hoi',
      from,
      rangeDays: 45,
      birthDate: '1990-01-15',
      limit: 5,
    });
    const anon = recommendGoodDays({
      eventId: 'cuoi_hoi',
      from,
      rangeDays: 45,
      limit: 5,
    });
    // Top iso may differ when animal hop/xung applied
    expect(withBirth[0].chiRelation).not.toBeNull();
    expect(anon[0].chiRelation).toBeNull();
  });

  it('scoreDayForEvent penalizes xau relative to tot for same event', () => {
    const event = getEventType('khai_truong');
    // Scan a short window and compare max tot vs max xau scores
    let maxTot = -999;
    let maxXau = -999;
    for (let i = 0; i < 60; i += 1) {
      const d = new Date(2026, 8, 20 + i);
      const s = scoreDayForEvent(d, event, '1990-01-15');
      if (s.fortune.dayQuality === 'tot') maxTot = Math.max(maxTot, s.score);
      if (s.fortune.dayQuality === 'xau') maxXau = Math.max(maxXau, s.score);
    }
    expect(maxTot).toBeGreaterThan(maxXau);
  });
});
