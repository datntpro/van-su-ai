import {
  computeEffectivePro,
  computeEntitlement,
  isTrialActive,
} from '../src/lib/entitlement';

describe('entitlement', () => {
  const now = new Date('2026-09-13T05:00:00.000Z');

  test('paid Pro wins', () => {
    expect(
      computeEffectivePro(true, true, '2026-09-01T00:00:00.000Z', now),
    ).toBe(true);
  });

  test('active trial without paid', () => {
    expect(
      computeEffectivePro(false, true, '2026-09-20T00:00:00.000Z', now),
    ).toBe(true);
    expect(isTrialActive(true, '2026-09-20T00:00:00.000Z', now)).toBe(true);
  });

  test('consumed but expired → not pro', () => {
    expect(
      computeEffectivePro(false, true, '2026-09-10T00:00:00.000Z', now),
    ).toBe(false);
  });

  test('not consumed → not trial', () => {
    expect(
      computeEffectivePro(false, false, '2026-09-20T00:00:00.000Z', now),
    ).toBe(false);
  });

  test('soft paywall D5–6 window', () => {
    const ends = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const ent = computeEntitlement(
      {
        isProPaid: false,
        trialConsumed: true,
        trialStartedAt: '2026-09-08T05:00:00.000Z',
        trialEndsAt: ends,
        entitlementSource: 'trial',
      },
      now,
    );
    expect(ent.trialActive).toBe(true);
    expect(ent.softPaywallSuggested).toBe(true);
  });

  test('formula matches BA: is_pro OR (trial_consumed && now < ends)', () => {
    const ends = '2026-09-15T00:00:00.000Z';
    expect(computeEffectivePro(false, true, ends, now)).toBe(true);
    expect(computeEffectivePro(true, false, null, now)).toBe(true);
    expect(computeEffectivePro(false, true, '2026-09-01T00:00:00.000Z', now)).toBe(
      false,
    );
  });
});
