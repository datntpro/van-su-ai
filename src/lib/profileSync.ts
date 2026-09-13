import type { UserProfile } from '@/src/lib/profile';
import { getSupabase, type ProfileRow } from '@/src/lib/supabase';

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

/**
 * Load cloud profile; if empty and local has data, upsert local → cloud.
 * Prefer cloud birth_date when present; otherwise keep/merge local.
 */
export async function loadAndMergeProfile(
  userId: string,
  local: UserProfile | null,
): Promise<{ profile: UserProfile | null; isPro: boolean | null }> {
  const sb = getSupabase();
  if (!sb) {
    return { profile: local, isPro: null };
  }

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profileSync] load failed', error.message);
    return { profile: local, isPro: null };
  }

  let row = data as ProfileRow | null;

  // Ensure row exists (trigger may lag / legacy user)
  if (!row) {
    const { data: inserted, error: insertErr } = await sb
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id' })
      .select('*')
      .single();
    if (insertErr) {
      console.warn('[profileSync] insert failed', insertErr.message);
      return { profile: local, isPro: null };
    }
    row = inserted as ProfileRow;
  }

  const cloudProfile = rowToProfile(row);

  // Cloud has birth data → prefer cloud, refresh local cache
  if (cloudProfile) {
    return { profile: cloudProfile, isPro: row.is_pro };
  }

  // Cloud empty, local has onboarding → push to cloud
  if (local?.birthDate) {
    const { data: updated, error: upErr } = await sb
      .from('profiles')
      .update(profileToRow(local))
      .eq('id', userId)
      .select('*')
      .single();
    if (upErr) {
      console.warn('[profileSync] upsert local failed', upErr.message);
      return { profile: local, isPro: row.is_pro };
    }
    return {
      profile: rowToProfile(updated as ProfileRow) ?? local,
      isPro: (updated as ProfileRow).is_pro,
    };
  }

  return { profile: null, isPro: row.is_pro };
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

export async function saveIsProToCloud(userId: string, isPro: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('profiles').update({ is_pro: isPro }).eq('id', userId);
  if (error) console.warn('[profileSync] is_pro save failed', error.message);
}
