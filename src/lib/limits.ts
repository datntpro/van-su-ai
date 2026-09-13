import { getJson, setJson } from './storage';

const KEYS = {
  horoscope: 'limits:horoscope',
  face: 'limits:face',
  chat: 'limits:chat',
} as const;

type DayCounter = { date: string; count: number };
type WeekCounter = { week: string; count: number };

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function weekKey(d = new Date()): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${weekNo}`;
}

export const FREE_LIMITS = {
  horoscopePerDay: 1,
  facePerWeek: 1,
  chatMessages: 5,
} as const;

export async function canUseHoroscope(isPro: boolean): Promise<{ ok: boolean; remaining: number }> {
  if (isPro) return { ok: true, remaining: Infinity };
  const data = await getJson<DayCounter>(KEYS.horoscope, { date: '', count: 0 });
  const today = todayKey();
  const count = data.date === today ? data.count : 0;
  const remaining = Math.max(0, FREE_LIMITS.horoscopePerDay - count);
  return { ok: remaining > 0, remaining };
}

export async function consumeHoroscope(isPro: boolean): Promise<void> {
  if (isPro) return;
  const today = todayKey();
  const data = await getJson<DayCounter>(KEYS.horoscope, { date: '', count: 0 });
  const count = data.date === today ? data.count + 1 : 1;
  await setJson(KEYS.horoscope, { date: today, count });
}

export async function canUseFace(isPro: boolean): Promise<{ ok: boolean; remaining: number }> {
  if (isPro) return { ok: true, remaining: Infinity };
  const data = await getJson<WeekCounter>(KEYS.face, { week: '', count: 0 });
  const week = weekKey();
  const count = data.week === week ? data.count : 0;
  const remaining = Math.max(0, FREE_LIMITS.facePerWeek - count);
  return { ok: remaining > 0, remaining };
}

export async function consumeFace(isPro: boolean): Promise<void> {
  if (isPro) return;
  const week = weekKey();
  const data = await getJson<WeekCounter>(KEYS.face, { week: '', count: 0 });
  const count = data.week === week ? data.count + 1 : 1;
  await setJson(KEYS.face, { week, count });
}

export async function canUseChat(isPro: boolean): Promise<{ ok: boolean; remaining: number }> {
  if (isPro) return { ok: true, remaining: Infinity };
  const data = await getJson<DayCounter>(KEYS.chat, { date: '', count: 0 });
  const today = todayKey();
  const count = data.date === today ? data.count : 0;
  const remaining = Math.max(0, FREE_LIMITS.chatMessages - count);
  return { ok: remaining > 0, remaining };
}

export async function consumeChat(isPro: boolean): Promise<void> {
  if (isPro) return;
  const today = todayKey();
  const data = await getJson<DayCounter>(KEYS.chat, { date: '', count: 0 });
  const count = data.date === today ? data.count + 1 : 1;
  await setJson(KEYS.chat, { date: today, count });
}
