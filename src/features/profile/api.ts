import { readLocalFile } from '@/lib/files';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Profile = Tables<'profiles'> & { cpf: string | null };

export async function fetchMyProfile(userId: string): Promise<Profile> {
  const [profile, privateData] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_private').select('cpf').eq('id', userId).single(),
  ]);
  if (profile.error) throw profile.error;
  if (privateData.error) throw privateData.error;
  return { ...profile.data, cpf: privateData.data.cpf };
}

export async function isCpfAvailable(cpf: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_cpf_available', { p_cpf: cpf });
  if (error) throw error;
  return data === true;
}

export type ProfileInput = {
  fullName: string;
  birthDate: string; // ISO yyyy-mm-dd
  bio: string;
  cpf: string; // digits only
  avatarPath?: string | null;
};

export async function saveProfile(userId: string, input: ProfileInput) {
  const { error: privateError } = await supabase
    .from('profile_private')
    .update({ cpf: input.cpf })
    .eq('id', userId);
  if (privateError) throw privateError;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      birth_date: input.birthDate,
      bio: input.bio.trim() || null,
      ...(input.avatarPath !== undefined && { avatar_path: input.avatarPath }),
    })
    .eq('id', userId);
  if (error) throw error;
}

export async function completeOnboarding(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// Uploads a picked photo to "avatars/<user id>/avatar-<time>.<ext>" and
// returns the storage path.
export async function uploadAvatar(userId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const file = await readLocalFile(uri);

  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: mimeType });
  if (error) throw error;
  return path;
}

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

// Public profile of anyone (no CPF).
export type PublicProfile = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'full_name' | 'birth_date' | 'bio' | 'avatar_path' | 'contact_email' | 'created_at'
>;

export async function fetchProfile(id: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, birth_date, bio, avatar_path, contact_email, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProfileStats = {
  memberSince: string;
  posts: number;
  audience: number;
  claps: number;
  connections: number;
};

export async function fetchProfileStats(id: string): Promise<ProfileStats | null> {
  const { data, error } = await supabase.rpc('get_profile_stats', { p_profile_id: id });
  if (error) throw error;
  const row = data[0];
  if (!row) return null;
  return {
    memberSince: row.member_since,
    posts: Number(row.posts_count),
    audience: Number(row.audience_count),
    claps: Number(row.claps_count),
    connections: Number(row.connections_count),
  };
}

export type EditProfileInput = {
  fullName: string;
  username: string;
  birthDate: string; // ISO yyyy-mm-dd
  bio: string;
  contactEmail: string;
  avatarPath?: string;
};

export async function updateProfile(userId: string, input: EditProfileInput) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      username: input.username.trim().toLowerCase(),
      birth_date: input.birthDate,
      bio: input.bio.trim() || null,
      contact_email: input.contactEmail.trim() || null,
      ...(input.avatarPath && { avatar_path: input.avatarPath }),
    })
    .eq('id', userId);
  if (error) throw error;
}
