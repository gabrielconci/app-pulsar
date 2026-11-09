import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchMyProfile } from './api';

export const profileKeys = {
  me: (userId: string | undefined) => ['profile', 'me', userId] as const,
};

export function useMyProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: profileKeys.me(userId),
    queryFn: () => fetchMyProfile(userId!),
    enabled: !!userId,
  });
}
