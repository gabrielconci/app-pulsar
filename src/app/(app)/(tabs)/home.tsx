import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/layout';
import { AppText, Button, Icon } from '@/components/ui';
import { postDraft } from '@/features/posts/draft';
import { MediaError, pickMedia, prepareMedia } from '@/features/posts/media';
import { NewPostSheet } from '@/features/posts/components/NewPostSheet';
import { PostCard } from '@/features/posts/components/PostCard';
import { useFeed } from '@/features/posts/hooks';
import type { Post, PostType } from '@/features/posts/types';
import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing, touchTarget } from '@/theme';

export default function HomeScreen() {
  const feed = useFeed();
  const posts = feed.data?.pages.flat() ?? [];
  const [choosing, setChoosing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const openPost = useCallback((post: Post) => {
    router.push({ pathname: '/post/[id]', params: { id: post.id } });
  }, []);

  const startPost = async (type: PostType) => {
    setChoosing(false);
    setNotice(null);
    if (type === 'project') {
      router.push('/criar/projeto');
      return;
    }
    try {
      const assets = await pickMedia(type);
      if (!assets) return;
      if (type === 'carousel' && assets.length < 2) {
        setNotice('Escolha pelo menos 2 fotos ou vídeos para o carrossel.');
        return;
      }
      setPreparing(true);
      const media = await prepareMedia(assets);
      postDraft.set({ type, media });
      router.push('/criar/publicar');
    } catch (e) {
      setNotice(e instanceof MediaError ? e.message : errorMessage(e));
    } finally {
      setPreparing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nova publicação"
            onPress={() => setChoosing(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.plus, pressed && { backgroundColor: colors.primaryPressed }]}
          >
            <Icon name="plus" size={20} color={colors.onPrimary} />
          </Pressable>
        }
      />

      {notice ? (
        <Pressable onPress={() => setNotice(null)} style={styles.notice} accessibilityLiveRegion="polite">
          <AppText variant="caption" color="danger" align="center">
            {notice}
          </AppText>
        </Pressable>
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} onPress={openPost} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => {
              feed.refetch();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          feed.isPending ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <View style={styles.empty}>
              <AppText variant="bodyStrong" align="center">
                {feed.isError ? 'Não foi possível carregar.' : 'Nenhuma publicação ainda'}
              </AppText>
              <AppText variant="body" color="text2" align="center">
                {feed.isError ? errorMessage(feed.error) : 'Que tal começar o seu portfólio?'}
              </AppText>
              {feed.isError ? (
                <Button title="Tentar de novo" onPress={() => feed.refetch()} />
              ) : (
                <Button title="Criar publicação" onPress={() => setChoosing(true)} />
              )}
            </View>
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.more} /> : undefined
        }
      />

      <NewPostSheet visible={choosing} onClose={() => setChoosing(false)} onSelect={startPost} />

      {preparing ? (
        <View style={styles.overlay} accessibilityLiveRegion="polite">
          <View style={styles.overlayCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="body">Preparando mídia…</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Separator() {
  return <View style={{ height: spacing.xl }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  plus: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.sm, minHeight: touchTarget, justifyContent: 'center' },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 },
  loading: { marginTop: spacing.xxl },
  more: { paddingVertical: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.form, paddingBottom: spacing.xxl },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
});
