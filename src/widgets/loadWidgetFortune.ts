import type { UserProfile } from '@/src/lib/profile';
import { getPersonalizedDayFortune } from '@/src/lib/personalizedFortune';
import { getJson } from '@/src/lib/storage';
import { EMPTY_TRAITS, type UserTraits } from '@/src/lib/traits';

const PROFILE_KEY = 'user:profile';
const TRAITS_KEY = 'user:traits';

/** Load profile/traits from AsyncStorage and build today's personalized fortune. */
export async function loadWidgetFortune(date: Date = new Date()) {
  const profile = await getJson<UserProfile | null>(PROFILE_KEY, null);
  const traits = await getJson<UserTraits>(TRAITS_KEY, EMPTY_TRAITS);
  const person = profile?.birthDate
    ? {
        birthDate: profile.birthDate,
        displayName: profile.displayName,
        traits,
      }
    : null;
  return getPersonalizedDayFortune(date, person);
}
