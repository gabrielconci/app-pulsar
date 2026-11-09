import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMyProfile } from '@/features/profile/hooks';

// Entry point: sends the user to the right place for their state.
export default function Index() {
  const { session } = useAuth();
  const { data: profile } = useMyProfile();

  if (!session) return <Redirect href="/login" />;
  if (!profile?.onboarding_completed_at) {
    // Profile already saved: continue at the interests step.
    return <Redirect href={profile?.full_name ? '/interesses' : '/criar-perfil'} />;
  }
  return <Redirect href="/home" />;
}
