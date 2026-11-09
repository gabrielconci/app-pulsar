import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/layout';
import { AppText, Icon } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useNewPost } from '@/features/posts/useNewPost';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { SettingsSheet } from '@/features/profile/components/SettingsSheet';
import { colors, spacing, touchTarget } from '@/theme';

// Your own profile: gear (temporary settings menu) and "+" (new post).
export default function MyProfileScreen() {
  const { session } = useAuth();
  const newPost = useNewPost();
  const [settings, setSettings] = useState(false);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configurações"
            onPress={() => setSettings(true)}
            hitSlop={8}
            style={styles.gear}
          >
            <Icon name="settings" size={26} color={colors.text} />
          </Pressable>
        }
      />
      <ProfileView
        profileId={session!.user.id}
        onAdd={newPost.open}
        notice={
          newPost.notice ? (
            <Pressable onPress={newPost.clearNotice} accessibilityLiveRegion="polite">
              <AppText variant="caption" color="danger" align="center">
                {newPost.notice}
              </AppText>
            </Pressable>
          ) : null
        }
      />
      <SettingsSheet visible={settings} onClose={() => setSettings(false)} />
      {newPost.ui}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  gear: { width: touchTarget, height: touchTarget, alignItems: 'flex-end', justifyContent: 'center', marginRight: -spacing.xs },
});
