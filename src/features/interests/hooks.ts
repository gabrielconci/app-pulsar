import { useQuery } from '@tanstack/react-query';
import { fetchInterests, fetchProfileInterestIds } from './api';

export const interestKeys = {
  all: ['interests'] as const,
  ofProfile: (profileId: string | undefined) => ['interests', 'profile', profileId] as const,
};

export function useInterests() {
  return useQuery({ queryKey: interestKeys.all, queryFn: fetchInterests, staleTime: Infinity });
}

export function useProfileInterestIds(profileId: string | undefined) {
  return useQuery({
    queryKey: interestKeys.ofProfile(profileId),
    queryFn: () => fetchProfileInterestIds(profileId!),
    enabled: !!profileId,
  });
}
