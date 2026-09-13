import type { EntitlementSource } from '@/src/lib/entitlement';
import type { UserProfile } from '@/src/lib/profile';
import { getSupabase, type ProfileRow } from '@/src/lib/supabase';

export type CloudEntitlement = {
  isProPaid: boolean;
  trialConsumed: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  entitlementSource: EntitlementSource;
};

function rowToProfile(row: ProfileRow): UserProfile | null {
  if (!row.birth_date) return null;
  return {
    birthDate: row.birth_date,
    birthTime: row.birth_time ?? undefined,
    birthPlace: row.birth_place ?? undefined,
    displayName: row.display_name ?? undefined,
    createdAt: row.created_at,
  };
}

function profileToRow(profile: UserProfile) {
  return {
    birth_date: profile.birthDate,
    birth_time: profile.birthTime ?? null,
    birth_place: profile.birthPlace ?? null,
    display_name: profile.displayName ?? null,
  };
}

function rowToEntitlement(row: ProfileRow): CloudEntitlement {
  return {
    isProPaid: Boolean(row.is_pro),
    trialConsumed: Boolean(row.trial_consumed),
    trialStartedAt: row.trial_started_at ?? null,
    trialEndsAt: row.trial_ends_at ?? null,
    entitlementSource: (row.entitlement_source ?? 'none') as EntitlementSource,
  };
}

/**
 * Load cloud profile; if empty and local has data, upsert local → cloud.
 * Prefer cloud birth_date when present; otherwise keep/merge local.
 */
export async function loadAndMergeProfile(
  userId: string,
  local: UserProfile | null,
): Promise<{
  profile: UserProfile | null;
  entitlement: CloudEntitlement | null;
}> {
  const sb = getSupabase();
  if (!sb) {
    return { profile: local, entitlement: null };
  }

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profileSync] load failed', error.message);
    return { profile: local, entitlement: null };
  }

  let row = data as ProfileRow | null;

  if (!row) {
    const { data: inserted, error: insertErr } = await sb
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id' })
      .select('*')
      .single();
    if (insertErr) {
      console.warn('[profileSync] insert failed', insertErr.message);
      return { profile: local, entitlement: null };
    }
    row = inserted as ProfileRow;
  }

  const cloudProfile = rowToProfile(row);

  if (cloudProfile) {
    return { profile: cloudProfile, entitlement: rowToEntitlement(row) };
  }

  if (local?.birthDate) {
    const { data: updated, error: upErr } = await sb
      .from('profiles')
      .update(profileToRow(local))
      .eq('id', userId)
      .select('*')
      .single();
    if (upErr) {
      console.warn('[profileSync] upsert local failed', upErr.message);
      return { profile: local, entitlement: rowToEntitlement(row) };
    }
    const updatedRow = updated as ProfileRow;
    return {
      profile: rowToProfile(updatedRow) ?? local,
      entitlement: rowToEntitlement(updatedRow),
    };
  }

  return { profile: null, entitlement: rowToEntitlement(row) };
}

/** Persist onboarding / profile edits to Supabase when logged in with real client. */
export async function saveProfileToCloud(
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.from('profiles').upsert(
    {
      id: userId,
      ...profileToRow(profile),
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.warn('[profileSync] save failed', error.message);
  }
}

/**
 * Start 7-day trial once (Option A) via RPC when possible.
 * No-op for demo/offline (caller must not invoke).
 * Returns updated entitlement or null on failure.
 */
export async function startTrialOnCloud(userId: string): Promise<CloudEntitlement | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Prefer RPC (server now + anti re-trial)
  const { data: rpcData, error: rpcErr } = await sb.rpc('start_trial_if_eligible');
  if (!rpcErr && rpcData) {
    const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as ProfileRow;
    return rowToEntitlement(row);
  }
  if (rpcErr) {
    console.warn('[profileSync] start_trial RPC', rpcErr.message);
  }

  // Fallback: client update only if not consumed (weaker clock guarantee)
  const { data: current, error: loadErr } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (loadErr || !current) {
    console.warn('[profileSync] trial load failed', loadErr?.message);
    return null;
  }
  const row = current as ProfileRow;
  if (row.trial_consumed || row.is_pro || !row.birth_date) {
    return rowToEntitlement(row);
  }

  const started = new Date();
  const ends = new Date(started.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: updated, error: upErr } = await sb
    .from('profiles')
    .update({
      trial_started_at: started.toISOString(),
      trial_ends_at: ends.toISOString(),
      trial_consumed: true,
      entitlement_source: row.entitlement_source === 'revenuecat' ? 'revenuecat' : 'trial',
    })
    .eq('id', userId)
    .eq('trial_consumed', false)
    .select('*')
    .maybeSingle();

  if (upErr) {
    console.warn('[profileSync] trial update failed', upErr.message);
    return rowToEntitlement(row);
  }
  if (!updated) return rowToEntitlement(row);
  return rowToEntitlement(updated as ProfileRow);
}

/**
 * Sync paid Pro from RevenueCat / server — store builds must only flip is_pro this way
 * (or explicit server field), never from random UI.
 */
export async function syncPaidProToCloud(
  userId: string,
  isProPaid: boolean,
  source: EntitlementSource = 'revenuecat',
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from('profiles')
    .update({
      is_pro: isProPaid,
      entitlement_source: isProPaid ? source : 'none',
    })
    .eq('id', userId);
  if (error) console.warn('[profileSync] paid pro sync failed', error.message);
}

/** @deprecated Use syncPaidProToCloud — kept for __DEV__ demo toggle only. */
export async function saveIsProToCloud(userId: string, isPro: boolean): Promise<void> {
  await syncPaidProToCloud(userId, isPro, isPro ? 'promo' : 'none');
}
