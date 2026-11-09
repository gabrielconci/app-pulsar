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
  const file = await fetch(uri).then((r) => r.arrayBuffer());

  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: mimeType });
  if (error) throw error;
  return path;
}

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
