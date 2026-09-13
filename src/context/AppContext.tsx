import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/src/context/AuthContext';
import type { UserProfile } from '@/src/lib/profile';
import {
  loadAndMergeProfile,
  saveIsProToCloud,
  saveProfileToCloud,
} from '@/src/lib/profileSync';
import { getJson, setJson, getString, setString } from '@/src/lib/storage';

type AppContextValue = {
  ready: boolean;
  profile: UserProfile | null;
  isPro: boolean;
  setProfile: (p: UserProfile) => Promise<void>;
  setIsPro: (v: boolean) => Promise<void>;
  clearProfile: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const PROFILE_KEY = 'user:profile';
const PRO_KEY = 'user:isPro';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { ready: authReady, user, isDemoAuth } = useAuth();
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isPro, setIsProState] = useState(false);

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
          setIsProState(localIsPro);
          setReady(true);
        }
        return;
      }

      // Demo auth: keep AsyncStorage only
      if (isDemoAuth || user.id.startsWith('demo-')) {
        if (!cancelled) {
          setProfileState(localProfile);
          setIsProState(localIsPro);
          setReady(true);
        }
        return;
      }

      const merged = await loadAndMergeProfile(user.id, localProfile);
      if (cancelled) return;

      if (merged.profile) {
        await setJson(PROFILE_KEY, merged.profile);
        setProfileState(merged.profile);
      } else {
        setProfileState(localProfile);
      }

      // Prefer cloud is_pro when we got a boolean; else local
      if (typeof merged.isPro === 'boolean') {
        await setString(PRO_KEY, merged.isPro ? '1' : '0');
        setIsProState(merged.isPro);
      } else {
        setIsProState(localIsPro);
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id, isDemoAuth]);

  const setProfile = useCallback(
    async (p: UserProfile) => {
      await setJson(PROFILE_KEY, p);
      setProfileState(p);
      if (user && !isDemoAuth && !user.id.startsWith('demo-')) {
        await saveProfileToCloud(user.id, p);
      }
    },
    [user, isDemoAuth],
  );

  const setIsPro = useCallback(
    async (v: boolean) => {
      await setString(PRO_KEY, v ? '1' : '0');
      setIsProState(v);
      if (user && !isDemoAuth && !user.id.startsWith('demo-')) {
        await saveIsProToCloud(user.id, v);
      }
    },
    [user, isDemoAuth],
  );

  const clearProfile = useCallback(async () => {
    await setJson(PROFILE_KEY, null);
    setProfileState(null);
  }, []);

  const value = useMemo(
    () => ({
      ready: authReady && ready,
      profile,
      isPro,
      setProfile,
      setIsPro,
      clearProfile,
    }),
    [authReady, ready, profile, isPro, setProfile, setIsPro, clearProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
