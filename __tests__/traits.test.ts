import {
  applyAnswerToTraits,
  countFilledExtras,
  EMPTY_TRAITS,
  extractBirthTime,
  hasEnoughContext,
  isSkipAnswer,
  mergeTraits,
  nextMissingField,
} from '../src/lib/traits';
import { mapTrialRpcError } from '../src/lib/trialError';

describe('traits intake', () => {
  test('next missing starts at birthTime when empty', () => {
    expect(nextMissingField(undefined, EMPTY_TRAITS)?.id).toBe('birthTime');
    expect(nextMissingField('08:30', EMPTY_TRAITS)?.id).toBe('gender');
  });

  test('apply gender then career', () => {
    const a = applyAnswerToTraits('gender', 'nữ', EMPTY_TRAITS);
    expect(a.traits.gender).toBe('nữ');
    const b = applyAnswerToTraits('career', 'kỹ sư phần mềm', a.traits);
    expect(b.traits.career).toBe('kỹ sư phần mềm');
    expect(b.traits.gender).toBe('nữ');
  });

  test('concerns split + year goal in questionnaire', () => {
    const a = applyAnswerToTraits('concerns', 'công việc, tình cảm', EMPTY_TRAITS);
    expect(a.traits.concerns).toEqual(['công việc', 'tình cảm']);
    const b = applyAnswerToTraits('yearGoal', 'đổi việc', a.traits);
    expect(b.traits.questionnaire.year_goal).toBe('đổi việc');
  });

  test('extract HH:mm from free text', () => {
    expect(extractBirthTime('khoảng 8:05 sáng')).toBe('08:05');
    expect(extractBirthTime('không nhớ')).toBeUndefined();
  });

  test('skip answers do not fill fields', () => {
    expect(isSkipAnswer('bỏ qua')).toBe(true);
    const a = applyAnswerToTraits('gender', 'không nhớ', EMPTY_TRAITS);
    expect(a.traits.gender).toBeUndefined();
  });

  test('enough context at 3 extras', () => {
    const t = mergeTraits(EMPTY_TRAITS, {
      gender: 'nam',
      career: 'GV',
      relationshipStatus: 'độc thân',
    });
    expect(countFilledExtras(undefined, t)).toBe(3);
    expect(hasEnoughContext(undefined, t)).toBe(true);
    expect(hasEnoughContext(undefined, EMPTY_TRAITS)).toBe(false);
  });

  test('birthTime counts toward extras', () => {
    expect(countFilledExtras('21:00', EMPTY_TRAITS)).toBe(1);
    const t = mergeTraits(EMPTY_TRAITS, { gender: 'nữ', career: 'BS' });
    expect(hasEnoughContext('21:00', t)).toBe(true);
  });
});

describe('trial RPC error mapping', () => {
  test('maps known RPC messages', () => {
    expect(mapTrialRpcError('not authenticated')).toMatch(/đăng nhập/i);
    expect(mapTrialRpcError('birth_date required before trial')).toMatch(/ngày sinh/i);
    expect(mapTrialRpcError(null)).toMatch(/thử lại/i);
  });
});


describe('personalized horoscope mock', () => {
  test('weaves traits into reading', async () => {
    const { generateDailyHoroscope } = await import('../src/lib/horoscope');
    const { mergeTraits, EMPTY_TRAITS } = await import('../src/lib/traits');
    const traits = mergeTraits(EMPTY_TRAITS, {
      gender: 'nữ',
      career: 'giáo viên',
      relationshipStatus: 'đã kết hôn',
      concerns: ['sức khỏe'],
      questionnaire: { year_goal: 'nghỉ ngơi nhiều hơn' },
    });
    const r = await generateDailyHoroscope(
      {
        birthDate: '1991-05-12',
        birthTime: '07:15',
        displayName: 'Lan',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      new Date('2026-09-13T05:00:00.000Z'),
      traits,
    );
    expect(r.text).toMatch(/Lan/);
    expect(r.text).toMatch(/giáo viên/);
    expect(r.text).toMatch(/đã kết hôn/);
    expect(r.text).toMatch(/sức khỏe/);
    expect(r.text).toMatch(/nghỉ ngơi nhiều hơn/);
    expect(r.source).toBe('mock');
  });
});
