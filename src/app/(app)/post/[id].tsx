import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/layout';
import { AppText, Button, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { deletePost, mediaUrl, recordView } from '@/features/posts/api';
import { CommentsSheet } from '@/features/posts/components/CommentsSheet';
import { DescriptionSheet } from '@/features/posts/components/DescriptionSheet';
import { AUTHOR_BAR_HEIGHT, PostAuthorBar } from '@/features/posts/components/PostAuthorBar';
import { PostActionsMenu, type PostAction } from '@/features/posts/components/PostActionsMenu';
import { PostMediaView, toSources } from '@/features/posts/components/PostMediaView';
import { ShareSheet } from '@/features/posts/components/ShareSheet';
import { postKeys, removePostFromCache, usePost, useToggleClap } from '@/features/posts/hooks';
import type { Post } from '@/features/posts/types';
import { useOpenProfile } from '@/features/profile/useOpenProfile';
import { errorMessage } from '@/lib/errors';
import { colors, spacing } from '@/theme';

type Sheet = 'description' | 'comments' | 'share' | null;

// Open post (view only, plus the ⋮ actions). Photos, videos and carousels
// fill the screen on black; projects read like an article.
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: post, isPending, error } = usePost(id);
  const toggleClap = useToggleClap(post);
  const openProfile = useOpenProfile();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwner = !!post && post.author_id === session?.user.id;

  // Count this person in the post's "Público" (once; authors don't count).
  const postId = post?.id;
  useEffect(() => {
    if (postId && !isOwner) recordView(postId).catch(() => {});
  }, [postId, isOwner]);

  if (!post) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        {isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <AppText variant="body" color="text2" align="center">
              {error ? errorMessage(error) : 'Esta publicação não existe mais.'}
            </AppText>
            <Button title="Voltar" onPress={() => router.back()} />
          </>
        )}
      </View>
    );
  }

  const onAction = (action: PostAction) => {
    switch (action) {
      case 'clap':
        toggleClap.mutate(!post.clapped_by_me);
        break;
      case 'description':
      case 'comments':
      case 'share':
        setSheet(action);
        break;
      case 'edit':
        router.push({ pathname: '/editar-post/[id]', params: { id: post.id } });
        break;
      case 'delete':
        setDeleteError(null);
        setConfirmDelete(true);
        break;
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post);
      removePostFromCache(queryClient, post.id);
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      setConfirmDelete(false);
      router.back();
    } catch (e) {
      setDeleteError(errorMessage(e));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const isProject = post.type === 'project';

  return (
    <View style={[styles.screen, { backgroundColor: isProject ? colors.bg : colors.black }]}>
      <StatusBar style="light" />
      {isProject ? <ProjectBody post={post} /> : <MediaBody post={post} />}

      <View style={[styles.back, { top: insets.top + spacing.xs }]}>
        <BackButton tone="light" />
      </View>

      <PostAuthorBar post={post} tone={isProject ? 'light' : 'dark'} onPress={() => openProfile(post.author_id)} />
      <View style={[styles.menu, { bottom: insets.bottom + AUTHOR_BAR_HEIGHT - 26 }]} pointerEvents="box-none">
        <PostActionsMenu clapped={post.clapped_by_me} isOwner={isOwner} onAction={onAction} />
      </View>

      {deleteError ? (
        <View style={[styles.toast, { top: insets.top + 56 }]}>
          <AppText variant="caption" color="white">
            {deleteError}
          </AppText>
        </View>
      ) : null}

      <DescriptionSheet post={post} visible={sheet === 'description'} onClose={() => setSheet(null)} />
      <CommentsSheet post={post} visible={sheet === 'comments'} onClose={() => setSheet(null)} />
      <ShareSheet post={post} visible={sheet === 'share'} onClose={() => setSheet(null)} />
      <ConfirmDialog
        visible={confirmDelete}
        message="Deseja excluir a publicação?"
        confirmLabel="Excluir"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </View>
  );
}

function MediaBody({ post }: { post: Post }) {
  const { width, height } = useWindowDimensions();
  return <PostMediaView items={toSources(post.media, mediaUrl)} width={width} height={height} />;
}

// Project: cover fading into white, title, subtitle, orange divider, text and
// the other images (Figma "Meu projeto").
function ProjectBody({ post }: { post: Post }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cover, ...rest] = post.media;
  const coverHeight = Math.round(height * 0.52);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + AUTHOR_BAR_HEIGHT + spacing.xl }}>
      <View style={{ height: coverHeight }}>
        {cover ? <Image source={mediaUrl(cover.path)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(255,255,255,0)', colors.bg]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.article}>
        <AppText variant="title" style={styles.projectTitle} accessibilityRole="header">
          {post.title}
        </AppText>
        {post.subtitle ? (
          <AppText variant="body" color="text2">
            {post.subtitle}
          </AppText>
        ) : null}
        <View style={styles.divider} />
        <AppText variant="body" style={styles.projectBody}>
          {post.body}
        </AppText>
      </View>
      {rest.map((m) => (
        <Image
          key={m.path}
          source={mediaUrl(m.path)}
          style={{ width, height: m.width && m.height ? (width * m.height) / m.width : width }}
          contentFit="cover"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.form },
  back: { position: 'absolute', left: spacing.lg },
  menu: { position: 'absolute', right: spacing.xl },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  article: { marginTop: -spacing.xxl, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  projectTitle: { fontSize: 24, lineHeight: 30 },
  divider: { alignSelf: 'center', width: 1.5, height: 24, backgroundColor: colors.primary, marginVertical: spacing.xl },
  projectBody: { lineHeight: 22 },
});
