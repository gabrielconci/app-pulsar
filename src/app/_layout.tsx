import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { useMyProfile } from '@/features/profile/hooks';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Decides which group of screens is reachable:
//  - logged out           -> (auth): login, cadastro, confira seu email
//  - logged in, new user  -> (onboarding): criar perfil, interesses
//  - logged in, onboarded -> (app): tabs and the rest
function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { session, loading } = useAuth();
  const profile = useMyProfile();

  const signedIn = !!session;
  const ready = (fontsLoaded || !!fontError) && !loading && (!signedIn || !profile.isPending);
  const onboarded = !!profile.data?.onboarding_completed_at;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
