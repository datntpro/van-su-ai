import { getSupabase } from '@/src/lib/supabase';

export type StoredChatRole = 'user' | 'assistant' | 'system';

export type StoredHoroscopeMessage = {
  id: string;
  role: StoredChatRole;
  content: string;
  createdAt: string;
};

export async function loadHoroscopeChats(
  userId: string,
  limit = 50,
): Promise<StoredHoroscopeMessage[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('horoscope_chats')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('[horoscopeChat] load failed', error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    role: r.role as StoredChatRole,
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

export async function appendHoroscopeChat(
  userId: string,
  role: StoredChatRole,
  content: string,
): Promise<StoredHoroscopeMessage | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('horoscope_chats')
    .insert({ user_id: userId, role, content })
    .select('id, role, content, created_at')
    .single();
  if (error) {
    console.warn('[horoscopeChat] insert failed', error.message);
    return null;
  }
  return {
    id: data.id as string,
    role: data.role as StoredChatRole,
    content: data.content as string,
    createdAt: data.created_at as string,
  };
}

export async function clearHoroscopeChats(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('horoscope_chats').delete().eq('user_id', userId);
  if (error) console.warn('[horoscopeChat] clear failed', error.message);
}
