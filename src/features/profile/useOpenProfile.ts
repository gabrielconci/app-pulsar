import { router } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';

// Opens someone's profile; your own opens the Perfil tab.
export function useOpenProfile() {
  const { session } = useAuth();
  const myId = session?.user.id;

  return useCallback(
    (profileId: string) => {
      if (profileId === myId) router.navigate('/perfil');
      else router.push({ pathname: '/usuario/[id]', params: { id: profileId } });
    },
    [myId],
  );
}
