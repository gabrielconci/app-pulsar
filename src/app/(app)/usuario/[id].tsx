import { Redirect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/layout';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { colors } from '@/theme';

// Someone else's profile: same layout, view only (no gear, no "+").
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  if (id === session?.user.id) return <Redirect href="/perfil" />;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader onBack />
      <ProfileView profileId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
