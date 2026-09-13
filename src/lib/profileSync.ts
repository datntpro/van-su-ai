import type { EntitlementSource } from '@/src/lib/entitlement';
import type { UserProfile } from '@/src/lib/profile';
import {
  EMPTY_TRAITS,
  type TraitsQuestionnaire,
  type UserTraits,
} from '@/src/lib/traits';
import { getSupabase, type ProfileRow, type UserTraitsRow } from '@/src/lib/supabase';
import { mapTrialRpcError } from '@/src/lib/trialError';

export type CloudEntitlement = {
  isProPaid: boolean;
  trialConsumed: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  entitlementSource: EntitlementSource;
};

export type TrialStartResult = {
  entitlement: CloudEntitlement | null;
  error?: string;
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

export function rowToTraits(row: UserTraitsRow): UserTraits {
  const q = (row.questionnaire ?? {}) as TraitsQuestionnaire;
  return {
    gender: row.gender ?? undefined,
    relationshipStatus: row.relationship_status ?? undefined,
    career: row.career ?? undefined,
    concerns: Array.isArray(row.concerns) ? row.concerns : [],
    locationCurrent: row.location_current ?? undefined,
    additionalNotes: row.additional_notes ?? undefined,
    questionnaire: q,
    updatedAt: row.updated_at,
  };
}

function traitsToRow(userId: string, traits: UserTraits) {
  return {
    user_id: userId,
    gender: traits.gender ?? null,
    relationship_status: traits.relationshipStatus ?? null,
    career: traits.career ?? null,
    concerns: traits.concerns ?? [],
    location_current: traits.locationCurrent ?? null,
    additional_notes: traits.additionalNotes ?? null,
    questionnaire: traits.questionnaire ?? {},
  };
}

/**
 * Load cloud profile; if empty and local has data, upsert local → cloud
 * (allowed columns only — never entitlement fields).
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

/** Persist onboarding / profile edits — allowed columns only. */
export async function saveProfileToCloud(
  userId: string,
  profile: UserProfile,
): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return {};

  const { error } = await sb.from('profiles').upsert(
    {
      id: userId,
      ...profileToRow(profile),
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.warn('[profileSync] save failed', error.message);
    return { error: error.message };
  }
  return {};
}

export async function loadTraitsFromCloud(
  userId: string,
  local: UserTraits | null,
): Promise<UserTraits> {
  const sb = getSupabase();
  if (!sb) return local ?? EMPTY_TRAITS;

  const { data, error } = await sb
    .from('user_traits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profileSync] traits load failed', error.message);
    return local ?? EMPTY_TRAITS;
  }
  if (!data) {
    if (local && (local.gender || local.career || local.concerns.length)) {
      await saveTraitsToCloud(userId, local);
      return local;
    }
    return local ?? EMPTY_TRAITS;
  }
  // Cloud is source of truth for signed-in users
  return rowToTraits(data as UserTraitsRow);
}

export async function saveTraitsToCloud(
  userId: string,
  traits: UserTraits,
): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return {};
  const { error } = await sb
    .from('user_traits')
    .upsert(traitsToRow(userId, traits), { onConflict: 'user_id' });
  if (error) {
    console.warn('[profileSync] traits save failed', error.message);
    return { error: error.message };
  }
  return {};
}

/**
 * Start 7-day trial once via RPC only.
 * NO client UPDATE of trial_* / is_pro — if RPC fails, return error.
 */
export async function startTrialOnCloud(_userId: string): Promise<TrialStartResult> {
  const sb = getSupabase();
  if (!sb) {
    return { entitlement: null, error: 'Chưa cấu hình Supabase — không thể cấp trial cloud.' };
  }

  const { data: rpcData, error: rpcErr } = await sb.rpc('start_trial_if_eligible');
  if (!rpcErr && rpcData) {
    const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as ProfileRow;
    return { entitlement: rowToEntitlement(row) };
  }

  console.warn('[profileSync] start_trial RPC', rpcErr?.message);
  return {
    entitlement: null,
    error: mapTrialRpcError(rpcErr?.message),
  };
}

/**
 * Paid Pro must be written by service_role / apply_paid_pro webhook — never from Expo.
 */
export async function syncPaidProToCloud(
  _userId: string,
  _isProPaid: boolean,
  _source: EntitlementSource = 'revenuecat',
): Promise<void> {
  console.warn(
    '[profileSync] syncPaidProToCloud skipped — entitlement columns are server/RPC only',
  );
}

/** @deprecated Demo toggle is local-only; does not write is_pro. */
export async function saveIsProToCloud(_userId: string, _isPro: boolean): Promise<void> {
  console.warn('[profileSync] saveIsProToCloud skipped — clients cannot UPDATE is_pro');
}

export { mapTrialRpcError } from '@/src/lib/trialError';
