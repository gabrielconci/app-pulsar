import * as Linking from 'expo-linking';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet } from '@/components/ui';
import { spacing } from '@/theme';
import type { Post } from '../types';
import { SocialIcon, type SocialApp } from './SocialIcon';

type Props = { post: Post; visible: boolean; onClose: () => void };

const APPS: { app: SocialApp; label: string }[] = [
  { app: 'whatsapp', label: 'Whatsapp' },
  { app: 'instagram', label: 'Instagram' },
  { app: 'tiktok', label: 'Tiktok' },
  { app: 'facebook', label: 'Facebook' },
  { app: 'more', label: 'Mais' },
];

// Link that opens the post in the app ("pulsar://post/<id>").
export function postLink(postId: string) {
  return `pulsar://post/${postId}`;
}

// "Compartilhar com". The row of people from Figma stays hidden until the
// app has messages. WhatsApp opens directly; Instagram, TikTok and Facebook
// don't accept a shared link without their own SDKs, so they (and "Mais")
// open Android's share sheet, where the user picks the app.
export function ShareSheet({ post, visible, onClose }: Props) {
  const name = post.author_full_name ?? post.author_username;
  const message = `Veja a publicação de ${name} no Pulsar: ${postLink(post.id)}`;

  const share = async (app: SocialApp) => {
    onClose();
    if (app === 'whatsapp') {
      try {
        await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
        return;
      } catch {
        // WhatsApp not installed: fall back to the share sheet.
      }
    }
    await Share.share({ message });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Compartilhar com">
      <View style={styles.row}>
        {APPS.map(({ app, label }) => (
          <Pressable
            key={app}
            accessibilityRole="button"
            accessibilityLabel={`Compartilhar no ${label}`}
            onPress={() => share(app)}
            style={({ pressed }) => [styles.app, pressed && styles.pressed]}
          >
            <SocialIcon app={app} />
            <AppText variant="caption" align="center">
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  app: { alignItems: 'center', gap: spacing.sm, minWidth: 64, paddingVertical: spacing.xs },
  pressed: { opacity: 0.6 },
});
