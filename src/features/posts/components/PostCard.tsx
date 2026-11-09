import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Avatar, Icon } from '@/components/ui';
import { avatarUrl } from '@/features/profile/api';
import { colors, radius, spacing } from '@/theme';
import { formatPostDate } from '@/utils/date';
import { mediaUrl } from '../api';
import type { Post } from '../types';

type Props = {
  post: Post;
  onPress: (post: Post) => void;
  onAuthorPress: (authorId: string) => void;
};

// Height / width of the card photo in the Figma Home frame (392 x 510).
const MEDIA_RATIO = 510 / 392;

// Home card: photo with the title pill (title + style, when there is a
// title), then a strip with the author and the date.
export const PostCard = memo(function PostCard({ post, onPress, onAuthorPress }: Props) {
  const first = post.media[0];
  const cover = first ? (first.kind === 'video' ? first.thumbnail_path : first.path) : null;
  const name = post.author_full_name ?? post.author_username;

  return (
    <Pressable
      onPress={() => onPress(post)}
      accessibilityRole="button"
      accessibilityLabel={`Publicação de ${name}${post.title ? `: ${post.title}` : ''}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.media, { aspectRatio: 1 / MEDIA_RATIO }]}>
        {cover ? (
          <Image source={mediaUrl(cover)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={post.id} />
        ) : null}

        {post.title ? (
          <View style={styles.pill}>
            <AppText variant="bodyStrong" color="white" numberOfLines={1} style={styles.pillTitle}>
              {post.title}
            </AppText>
            {post.interest_name ? (
              <AppText variant="captionStrong" color="white" numberOfLines={1} style={styles.pillStyle}>
                {post.interest_name}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {post.type === 'video' || first?.kind === 'video' ? (
          <View style={styles.badge}>
            <Icon name="play" size={14} color={colors.white} />
          </View>
        ) : post.type === 'carousel' ? (
          <View style={styles.badge}>
            <AppText variant="captionStrong" color="white">
              1/{post.media.length}
            </AppText>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => onAuthorPress(post.author_id)}
        accessibilityRole="link"
        accessibilityLabel={`Ver perfil de ${name}`}
        style={styles.footer}
      >
        <Avatar uri={avatarUrl(post.author_avatar_path)} name={name} size={44} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.name}>
          {name}
        </AppText>
        <AppText variant="caption" color="text2">
          {formatPostDate(post.created_at)}
        </AppText>
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  pressed: { opacity: 0.92 },
  media: { width: '100%', backgroundColor: colors.surface2 },
  pill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.scrim,
  },
  pillTitle: { flex: 1, textDecorationLine: 'underline' },
  pillStyle: { fontSize: 13, maxWidth: '45%' },
  badge: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    minWidth: 32,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  name: { flex: 1 },
});
