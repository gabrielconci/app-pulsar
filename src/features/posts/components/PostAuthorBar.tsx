import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Avatar } from '@/components/ui';
import { avatarUrl } from '@/features/profile/api';
import { colors, spacing } from '@/theme';
import type { Post } from '../types';

export const AUTHOR_BAR_HEIGHT = 72;

type Props = {
  post: Post;
  // Dark over photos and videos; light under a project's text.
  tone: 'dark' | 'light';
  onPress: () => void;
};

// Bottom bar of the open post with the author's photo and name.
export function PostAuthorBar({ post, tone, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const name = post.author_full_name ?? post.author_username;
  const dark = tone === 'dark';

  return (
    <View
      style={[
        styles.bar,
        dark ? styles.dark : styles.light,
        { height: AUTHOR_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
      ]}
    >
      <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`Ver perfil de ${name}`} style={styles.author}>
        <Avatar uri={avatarUrl(post.author_avatar_path)} name={name} size={32} />
        <AppText variant="bodyStrong" color={dark ? 'white' : 'text'} numberOfLines={1} style={styles.name}>
          {name}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.xl + spacing.sm,
    // Room for the ⋮ button on the right.
    paddingRight: 88,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dark: { backgroundColor: 'rgba(20, 19, 18, 0.94)' },
  light: { backgroundColor: colors.bg, borderTopWidth: 1, borderColor: colors.surface2 },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, flexShrink: 1 },
  name: { flexShrink: 1 },
});
