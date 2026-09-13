import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/src/context/AuthContext';
import {
  computeEntitlement,
  EMPTY_ENTITLEMENT,
  type EffectiveEntitlement,
  type EntitlementSource,
} from '@/src/lib/entitlement';
import { canShowDemoProToggle } from '@/src/lib/flags';
import type { UserProfile } from '@/src/lib/profile';
import {
  loadAndMergeProfile,
  saveIsProToCloud,
  saveProfileToCloud,
  startTrialOnCloud,
  syncPaidProToCloud,
  type CloudEntitlement,
} from '@/src/lib/profileSync';
import { getJson, setJson, getString, setString } from '@/src/lib/storage';
import {
  configurePurchases,
  syncPaidProFromCustomerInfo,
} from '@/src/services/revenuecat';

type AppContextValue = {
  ready: boolean;
  profile: UserProfile | null;
  /** @deprecated Prefer effectivePro — kept as alias for paid|trial. */
  isPro: boolean;
  /** Paid-only flag (profiles.is_pro). */
  isProPaid: boolean;
  /** Single source for limits / ads: paid OR active trial. */
  effectivePro: boolean;
  entitlement: EffectiveEntitlement;
  /** True once after Option A trial start this session. */
  trialJustStarted: boolean;
  clearTrialJustStarted: () => void;
  /** Show expired modal once after trial ends. */
  showTrialExpiredModal: boolean;
  dismissTrialExpiredModal: () => void;
  setProfile: (p: UserProfile) => Promise<void>;
  /**
   * Demo/dev only — flips local + optional cloud is_pro.
   * No-op on store builds (canShowDemoProToggle === false).
   */
  setIsPro: (v: boolean) => Promise<void>;
  /** Apply paid Pro from RevenueCat CustomerInfo. */
  applyPaidFromRevenueCat: (paid: boolean) => Promise<void>;
  clearProfile: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const PROFILE_KEY = 'user:profile';
const PRO_KEY = 'user:isPro';
const TRIAL_EXPIRED_SEEN_KEY = 'trial:expiredSeenFor';

function cloudToPartial(c: CloudEntitlement | null, localPaid: boolean) {
  if (!c) {
    return {
      isProPaid: localPaid,
      trialConsumed: false,
      trialStartedAt: null as string | null,
      trialEndsAt: null as string | null,
      entitlementSource: (localPaid ? 'promo' : 'none') as EntitlementSource,
    };
  }
  return {
    isProPaid: c.isProPaid,
    trialConsumed: c.trialConsumed,
    trialStartedAt: c.trialStartedAt,
    trialEndsAt: c.trialEndsAt,
    entitlementSource: c.entitlementSource,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { ready: authReady, user, isDemoAuth } = useAuth();
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isProPaid, setIsProPaid] = useState(false);
  const [trialConsumed, setTrialConsumed] = useState(false);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [entitlementSource, setEntitlementSource] =
    useState<EntitlementSource>('none');
  const [trialJustStarted, setTrialJustStarted] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [tick, setTick] = useState(0);
  const startingTrial = useRef(false);
  const prevTrialActive = useRef<boolean | null>(null);

  const applyEntitlement = useCallback((c: CloudEntitlement | null, localPaid: boolean) => {
    const p = cloudToPartial(c, localPaid);
    setIsProPaid(p.isProPaid);
    setTrialConsumed(p.trialConsumed);
    setTrialStartedAt(p.trialStartedAt);
    setTrialEndsAt(p.trialEndsAt);
    setEntitlementSource(p.entitlementSource);
  }, []);

  const entitlement = useMemo(
    () =>
      computeEntitlement({
        isProPaid,
        trialConsumed,
        trialStartedAt,
        trialEndsAt,
        entitlementSource,
      }),
    // tick forces recompute as time passes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isProPaid, trialConsumed, trialStartedAt, trialEndsAt, entitlementSource, tick],
  );

  // Refresh countdown hourly
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Detect trial expiry → modal once
  useEffect(() => {
    if (!ready || !user || isDemoAuth) return;
    const wasActive = prevTrialActive.current;
    const nowActive = entitlement.trialActive;
    prevTrialActive.current = nowActive;

    if (wasActive === true && nowActive === false && entitlement.trialExpired) {
      (async () => {
        const key = `${TRIAL_EXPIRED_SEEN_KEY}:${user.id}:${trialEndsAt ?? ''}`;
        const seen = await getString(key);
        if (seen !== '1') {
          setShowTrialExpiredModal(true);
          await setString(key, '1');
        }
      })();
    }
  }, [
    ready,
    user,
    isDemoAuth,
    entitlement.trialActive,
    entitlement.trialExpired,
    trialEndsAt,
  ]);

  // Also check on load if already expired and never shown
  useEffect(() => {
    if (!ready || !user || isDemoAuth || !entitlement.trialExpired) return;
    (async () => {
      const key = `${TRIAL_EXPIRED_SEEN_KEY}:${user.id}:${trialEndsAt ?? ''}`;
      const seen = await getString(key);
      if (seen !== '1') {
        setShowTrialExpiredModal(true);
        await setString(key, '1');
      }
    })();
  }, [ready, user, isDemoAuth, entitlement.trialExpired, trialEndsAt]);

  const tryStartTrial = useCallback(
    async (userId: string, hasBirth: boolean) => {
      if (!hasBirth || startingTrial.current) return;
      if (isDemoAuth || userId.startsWith('demo-')) return;
      startingTrial.current = true;
      try {
        const beforeConsumed = trialConsumed;
        const ent = await startTrialOnCloud(userId);
        if (ent) {
          applyEntitlement(ent, ent.isProPaid);
          const active = computeEntitlement(ent).trialActive;
          // Banner once when trial newly granted this session
          if (!beforeConsumed && ent.trialConsumed && active) {
            setTrialJustStarted(true);
          }
        }
      } finally {
        startingTrial.current = false;
      }
    },
    [isDemoAuth, trialConsumed, applyEntitlement],
  );

  // Load local + merge cloud when auth user changes
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    (async () => {
      setReady(false);
      const [localProfile, pro] = await Promise.all([
        getJson<UserProfile | null>(PROFILE_KEY, null),
        getString(PRO_KEY),
      ]);
      const localIsPro = pro === '1';

      if (!user) {
        if (!cancelled) {
          setProfileState(localProfile);
          applyEntitlement(null, canShowDemoProToggle() ? localIsPro : false);
          setReady(true);
        }
        return;
      }

      // Demo auth: keep AsyncStorage only — NO cloud trial
      if (isDemoAuth || user.id.startsWith('demo-')) {
        if (!cancelled) {
          setProfileState(localProfile);
          applyEntitlement(null, canShowDemoProToggle() ? localIsPro : false);
          setReady(true);
        }
        return;
      }

      await configurePurchases(user.id);

      const merged = await loadAndMergeProfile(user.id, localProfile);
      if (cancelled) return;

      if (merged.profile) {
        await setJson(PROFILE_KEY, merged.profile);
        setProfileState(merged.profile);
      } else {
        setProfileState(localProfile);
      }

      let paid = merged.entitlement?.isProPaid ?? false;
      // Store / cloud: prefer server is_pro; local demo flag only in __DEV__
      if (canShowDemoProToggle() && typeof merged.entitlement?.isProPaid !== 'boolean') {
        paid = localIsPro;
      }

      applyEntitlement(
        merged.entitlement
          ? { ...merged.entitlement, isProPaid: paid }
          : null,
        paid,
      );
      await setString(PRO_KEY, paid ? '1' : '0');

      // RC sync hook (stub returns null until SDK wired)
      const rcPaid = await syncPaidProFromCustomerInfo();
      if (typeof rcPaid === 'boolean' && !cancelled) {
        setIsProPaid(rcPaid);
        await setString(PRO_KEY, rcPaid ? '1' : '0');
        if (rcPaid) {
          await syncPaidProToCloud(user.id, true, 'revenuecat');
          setEntitlementSource('revenuecat');
        }
      }

      // Option A: start trial after cloud signup + birth date complete
      const hasBirth = Boolean(merged.profile?.birthDate || localProfile?.birthDate);
      if (hasBirth && merged.entitlement && !merged.entitlement.trialConsumed) {
        await tryStartTrial(user.id, true);
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id, isDemoAuth, applyEntitlement, tryStartTrial]);

  const setProfile = useCallback(
    async (p: UserProfile) => {
      await setJson(PROFILE_KEY, p);
      setProfileState(p);
      if (user && !isDemoAuth && !user.id.startsWith('demo-')) {
        await saveProfileToCloud(user.id, p);
        // Option A: start trial once after onboarding birth date
        if (!trialConsumed) {
          await tryStartTrial(user.id, true);
        }
      }
    },
    [user, isDemoAuth, trialConsumed, tryStartTrial],
  );

  const setIsPro = useCallback(
    async (v: boolean) => {
      if (!canShowDemoProToggle()) {
        console.warn('[AppContext] setIsPro blocked outside __DEV__ / store build');
        return;
      }
      await setString(PRO_KEY, v ? '1' : '0');
      setIsProPaid(v);
      setEntitlementSource(v ? 'promo' : 'none');
      if (user && !isDemoAuth && !user.id.startsWith('demo-')) {
        await saveIsProToCloud(user.id, v);
      }
    },
    [user, isDemoAuth],
  );

  const applyPaidFromRevenueCat = useCallback(
    async (paid: boolean) => {
      setIsProPaid(paid);
      await setString(PRO_KEY, paid ? '1' : '0');
      if (paid) setEntitlementSource('revenuecat');
      if (user && !isDemoAuth && !user.id.startsWith('demo-')) {
        await syncPaidProToCloud(user.id, paid, 'revenuecat');
      }
    },
    [user, isDemoAuth],
  );

  const clearProfile = useCallback(async () => {
    await setJson(PROFILE_KEY, null);
    setProfileState(null);
  }, []);

  const refreshEntitlement = useCallback(async () => {
    if (!user || isDemoAuth || user.id.startsWith('demo-')) return;
    const merged = await loadAndMergeProfile(user.id, profile);
    if (merged.entitlement) applyEntitlement(merged.entitlement, merged.entitlement.isProPaid);
    setTick((t) => t + 1);
  }, [user, isDemoAuth, profile, applyEntitlement]);

  const clearTrialJustStarted = useCallback(() => setTrialJustStarted(false), []);
  const dismissTrialExpiredModal = useCallback(() => setShowTrialExpiredModal(false), []);

  const value = useMemo(
    () => ({
      ready: authReady && ready,
      profile,
      isPro: entitlement.effectivePro,
      isProPaid,
      effectivePro: entitlement.effectivePro,
      entitlement,
      trialJustStarted,
      clearTrialJustStarted,
      showTrialExpiredModal,
      dismissTrialExpiredModal,
      setProfile,
      setIsPro,
      applyPaidFromRevenueCat,
      clearProfile,
      refreshEntitlement,
    }),
    [
      authReady,
      ready,
      profile,
      isProPaid,
      entitlement,
      trialJustStarted,
      clearTrialJustStarted,
      showTrialExpiredModal,
      dismissTrialExpiredModal,
      setProfile,
      setIsPro,
      applyPaidFromRevenueCat,
      clearProfile,
      refreshEntitlement,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/** Hook alias for limits / ads — always use effectivePro. */
export function useEffectivePro(): {
  effectivePro: boolean;
  isProPaid: boolean;
  entitlement: EffectiveEntitlement;
} {
  const { effectivePro, isProPaid, entitlement } = useApp();
  return { effectivePro, isProPaid, entitlement };
}
