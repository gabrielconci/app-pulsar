import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export const MAX_INTERESTS = 8;

export type Interest = Pick<Tables<'interests'>, 'id' | 'name'>;

export async function fetchInterests(): Promise<Interest[]> {
  const { data, error } = await supabase.from('interests').select('id, name').order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchProfileInterestIds(profileId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from('profile_interests')
    .select('interest_id')
    .eq('profile_id', profileId);
  if (error) throw error;
  return data.map((row) => row.interest_id);
}

// Replaces all of the current user's interests (max 8, checked by the database).
export async function setMyInterests(ids: number[]) {
  const { error } = await supabase.rpc('set_my_interests', { p_interest_ids: ids });
  if (error) throw error;
}
