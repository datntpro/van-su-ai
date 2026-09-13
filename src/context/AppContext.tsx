import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { UserProfile } from '@/src/lib/profile';
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
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isPro, setIsProState] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, pro] = await Promise.all([
        getJson<UserProfile | null>(PROFILE_KEY, null),
        getString(PRO_KEY),
      ]);
      setProfileState(p);
      setIsProState(pro === '1');
      setReady(true);
    })();
  }, []);

  const setProfile = useCallback(async (p: UserProfile) => {
    await setJson(PROFILE_KEY, p);
    setProfileState(p);
  }, []);

  const setIsPro = useCallback(async (v: boolean) => {
    await setString(PRO_KEY, v ? '1' : '0');
    setIsProState(v);
  }, []);

  const clearProfile = useCallback(async () => {
    await setJson(PROFILE_KEY, null);
    setProfileState(null);
  }, []);

  const value = useMemo(
    () => ({ ready, profile, isPro, setProfile, setIsPro, clearProfile }),
    [ready, profile, isPro, setProfile, setIsPro, clearProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
