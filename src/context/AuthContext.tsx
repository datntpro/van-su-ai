import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import * as Linking from 'expo-linking';

import {
  completeAuthSessionFromUrl,
  getAuthRedirectTo,
} from '@/src/lib/authDeepLink';
import {
  authErrorVi,
  getSupabase,
  isSupabaseConfigured,
  isValidEmail,
} from '@/src/lib/supabase';
import { getJson, remove, setJson } from '@/src/lib/storage';

const DEMO_SESSION_KEY = 'auth:demoSession';

type DemoSession = {
  userId: string;
  email: string;
};

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  /** Demo/offline mock when Supabase env is empty */
  isDemoAuth: boolean;
  supabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
  /** Force refresh session token (cloud only). */
  refreshSession: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function validateCredentials(email: string, password: string): string | null {
  if (!email.trim()) return 'Vui lòng nhập email.';
  if (!isValidEmail(email)) return 'Định dạng email không hợp lệ.';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemo] = useState<DemoSession | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let unsubLink: (() => void) | undefined;

    (async () => {
      if (isSupabaseConfigured) {
        const sb = getSupabase()!;
        const { data, error } = await sb.auth.getSession();
        if (error) console.warn('[auth] getSession', error.message);
        setSession(data.session);
        const { data: sub } = sb.auth.onAuthStateChange(async (event, next) => {
          setSession(next);
          setDemo(null);
          // Soft refresh on TOKEN_REFRESHED / SIGNED_IN
          if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
            console.info('[auth]', event);
          }
        });
        unsub = () => sub.subscription.unsubscribe();

        // Email confirm / magic-link deep links (detectSessionInUrl is false on RN).
        const onUrl = ({ url }: { url: string }) => {
          void completeAuthSessionFromUrl(url);
        };
        void Linking.getInitialURL().then((url) => {
          if (url) void completeAuthSessionFromUrl(url);
        });
        const linkSub = Linking.addEventListener('url', onUrl);
        unsubLink = () => linkSub.remove();
      } else {
        const local = await getJson<DemoSession | null>(DEMO_SESSION_KEY, null);
        setDemo(local);
      }
      setReady(true);
    })();

    return () => {
      unsub?.();
      unsubLink?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const v = validateCredentials(email, password);
    if (v) return { error: v };

    if (!isSupabaseConfigured) {
      const demoSession: DemoSession = {
        userId: `demo-${email.trim().toLowerCase()}`,
        email: email.trim().toLowerCase(),
      };
      await setJson(DEMO_SESSION_KEY, demoSession);
      setDemo(demoSession);
      return {};
    }

    const sb = getSupabase()!;
    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: authErrorVi(error.message) };
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const v = validateCredentials(email, password);
    if (v) return { error: v };

    if (!isSupabaseConfigured) {
      const demoSession: DemoSession = {
        userId: `demo-${email.trim().toLowerCase()}`,
        email: email.trim().toLowerCase(),
      };
      await setJson(DEMO_SESSION_KEY, demoSession);
      setDemo(demoSession);
      return {};
    }

    const sb = getSupabase()!;
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Must match Supabase Dashboard Redirect URLs (not localhost:3000).
        emailRedirectTo: getAuthRedirectTo(),
      },
    });
    if (error) return { error: authErrorVi(error.message) };
    // If email confirmation is required, session may be null
    if (!data.session) {
      return { needsConfirm: true };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const sb = getSupabase();
      await sb?.auth.signOut();
      setSession(null);
    }
    await remove(DEMO_SESSION_KEY);
    setDemo(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) return {};
    const sb = getSupabase();
    if (!sb) return { error: 'Chưa cấu hình Supabase.' };
    const { data, error } = await sb.auth.refreshSession();
    if (error) return { error: authErrorVi(error.message) };
    setSession(data.session);
    return {};
  }, []);

  const isDemoAuth = !isSupabaseConfigured && demo != null;

  /** Synthetic user for demo mode so UI can treat "logged in" uniformly. */
  const demoUser = useMemo((): User | null => {
    if (!demo) return null;
    return {
      id: demo.userId,
      email: demo.email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;
  }, [demo]);

  const user = session?.user ?? demoUser;
  const hasSession = Boolean(session || demo);

  const value = useMemo(
    () => ({
      ready,
      session: hasSession ? session : null,
      user: hasSession ? user : null,
      isDemoAuth,
      supabaseConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [
      ready,
      session,
      user,
      hasSession,
      isDemoAuth,
      signIn,
      signUp,
      signOut,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
