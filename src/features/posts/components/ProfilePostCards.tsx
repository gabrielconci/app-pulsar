import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { mediaUrl } from '../api';
import type { Post } from '../types';

type Props = { post: Post; onPress: (post: Post) => void };

function coverOf(post: Post): string | null {
  const first = post.media[0];
  if (!first) return null;
  return mediaUrl(first.kind === 'video' ? (first.thumbnail_path ?? first.path) : first.path);
}

// Bottom strip with the underlined title (Figma profile cards).
function TitleStrip({ title }: { title: string }) {
  return (
    <View style={styles.strip}>
      <AppText variant="bodyStrong" align="center" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

// "Vídeos" tab card: tall media, style pill in the top-right corner and
// the title below. Used for videos, photos and carousels.
export const MediaGridCard = memo(function MediaGridCard({ post, onPress, width }: Props & { width: number }) {
  const cover = coverOf(post);
  const isVideo = post.media.some((m) => m.kind === 'video');

  return (
    <Pressable
      onPress={() => onPress(post)}
      accessibilityRole="button"
      accessibilityLabel={post.title ?? 'Publicação'}
      style={({ pressed }) => [styles.gridCard, { width }, pressed && styles.pressed]}
    >
      <View style={styles.gridMedia}>
        {cover ? <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={post.id} /> : null}
        {post.interest_name ? (
          <View style={styles.stylePill}>
            <AppText variant="captionStrong" color="white" numberOfLines={1}>
              {post.interest_name}
            </AppText>
          </View>
        ) : null}
        {isVideo || post.type === 'carousel' ? (
          <View style={styles.badge}>
            {post.type === 'carousel' ? (
              <AppText variant="captionStrong" color="white">
                1/{post.media.length}
              </AppText>
            ) : (
              <Icon name="play" size={12} color={colors.white} />
            )}
          </View>
        ) : null}
      </View>
      {post.title ? <TitleStrip title={post.title} /> : null}
    </Pressable>
  );
});

// "Projetos" tab card: wide cover and the title below.
export const ProjectCard = memo(function ProjectCard({ post, onPress }: Props) {
  const cover = coverOf(post);

  return (
    <Pressable
      onPress={() => onPress(post)}
      accessibilityRole="button"
      accessibilityLabel={post.title ?? 'Projeto'}
      style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}
    >
      <View style={styles.projectMedia}>
        {cover ? <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={post.id} /> : null}
        {post.interest_name ? (
          <View style={styles.stylePill}>
            <AppText variant="captionStrong" color="white" numberOfLines={1}>
              {post.interest_name}
            </AppText>
          </View>
        ) : null}
      </View>
      <TitleStrip title={post.title ?? 'Projeto'} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  gridCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface2 },
  gridMedia: { width: '100%', aspectRatio: 196 / 320, backgroundColor: colors.surface2 },
  projectCard: { marginHorizontal: spacing.md, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface2 },
  projectMedia: { width: '100%', aspectRatio: 406 / 222, backgroundColor: colors.surface2 },
  strip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, backgroundColor: colors.surface2 },
  title: { textDecorationLine: 'underline', fontSize: 14 },
  stylePill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.scrim,
  },
  badge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    minWidth: 26,
    height: 26,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
