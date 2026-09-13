/**
 * Central entitlement: paid Pro vs Trial Pro 7 days.
 *
 * effectivePro = is_pro (paid) OR (trial_consumed && now < trial_ends_at)
 * is_pro must remain paid-only — never flipped true solely for trial.
 */

export type EntitlementSource = 'none' | 'trial' | 'revenuecat' | 'promo';

export type EntitlementState = {
  /** Paid Pro only (profiles.is_pro / RevenueCat). */
  isProPaid: boolean;
  trialConsumed: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  entitlementSource: EntitlementSource;
  /** Server/client "now" ISO used for evaluation (prefer server). */
  evaluatedAt: string;
};

export type EffectiveEntitlement = EntitlementState & {
  effectivePro: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  /** Whole days remaining (ceil); 0 if not active. */
  trialDaysRemaining: number;
  /** Hours remaining (floor); 0 if not active. */
  trialHoursRemaining: number;
  /** Soft paywall window: day 5–6 of trial (hours left in [24h, 72h]). */
  softPaywallSuggested: boolean;
};

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;

export function isTrialActive(
  trialConsumed: boolean,
  trialEndsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!trialConsumed || !trialEndsAt) return false;
  const end = Date.parse(trialEndsAt);
  if (Number.isNaN(end)) return false;
  return now.getTime() < end;
}

/**
 * Spec: effectivePro = is_pro OR (trial_consumed && now < trial_ends_at)
 */
export function computeEffectivePro(
  isProPaid: boolean,
  trialConsumed: boolean,
  trialEndsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (isProPaid) return true;
  return isTrialActive(trialConsumed, trialEndsAt, now);
}

export function computeEntitlement(
  state: Omit<EntitlementState, 'evaluatedAt'> & { evaluatedAt?: string },
  now: Date = new Date(),
): EffectiveEntitlement {
  const evaluatedAt = state.evaluatedAt ?? now.toISOString();
  const trialActive = isTrialActive(state.trialConsumed, state.trialEndsAt, now);
  const trialExpired =
    state.trialConsumed &&
    Boolean(state.trialEndsAt) &&
    !trialActive &&
    !state.isProPaid;
  const effectivePro = state.isProPaid || trialActive;

  let trialDaysRemaining = 0;
  let trialHoursRemaining = 0;
  if (trialActive && state.trialEndsAt) {
    const msLeft = Math.max(0, Date.parse(state.trialEndsAt) - now.getTime());
    trialHoursRemaining = Math.floor(msLeft / MS_HOUR);
    trialDaysRemaining = Math.max(1, Math.ceil(msLeft / MS_DAY));
    if (msLeft <= 0) {
      trialDaysRemaining = 0;
      trialHoursRemaining = 0;
    }
  }

  // Soft paywall D5–6: between ~24h and ~72h remaining (days 5–6 of 7)
  const softPaywallSuggested =
    trialActive && trialHoursRemaining >= 24 && trialHoursRemaining <= 72;

  return {
    isProPaid: state.isProPaid,
    trialConsumed: state.trialConsumed,
    trialStartedAt: state.trialStartedAt,
    trialEndsAt: state.trialEndsAt,
    entitlementSource: state.entitlementSource,
    evaluatedAt,
    effectivePro,
    trialActive,
    trialExpired,
    trialDaysRemaining,
    trialHoursRemaining,
    softPaywallSuggested,
  };
}

export function formatTrialCountdown(ent: EffectiveEntitlement): string {
  if (!ent.trialActive) return '';
  const days = Math.floor(ent.trialHoursRemaining / 24);
  const hours = ent.trialHoursRemaining % 24;
  if (days > 0) return `Trial còn ${days} ngày ${hours} giờ`;
  if (ent.trialHoursRemaining > 0) return `Trial còn ${ent.trialHoursRemaining} giờ`;
  return 'Trial sắp hết';
}

export const EMPTY_ENTITLEMENT: EffectiveEntitlement = computeEntitlement({
  isProPaid: false,
  trialConsumed: false,
  trialStartedAt: null,
  trialEndsAt: null,
  entitlementSource: 'none',
});
