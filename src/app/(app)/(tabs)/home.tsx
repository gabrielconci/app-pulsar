import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/layout';
import { AppText, Button, Icon } from '@/components/ui';
import { PostCard } from '@/features/posts/components/PostCard';
import { useFeed } from '@/features/posts/hooks';
import type { Post } from '@/features/posts/types';
import { useNewPost } from '@/features/posts/useNewPost';
import { useOpenProfile } from '@/features/profile/useOpenProfile';
import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing, touchTarget } from '@/theme';

export default function HomeScreen() {
  const feed = useFeed();
  const posts = feed.data?.pages.flat() ?? [];
  const newPost = useNewPost();
  const openProfile = useOpenProfile();

  const openPost = useCallback((post: Post) => {
    router.push({ pathname: '/post/[id]', params: { id: post.id } });
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nova publicação"
            onPress={newPost.open}
            hitSlop={8}
            style={({ pressed }) => [styles.plus, pressed && { backgroundColor: colors.primaryPressed }]}
          >
            <Icon name="plus" size={20} color={colors.onPrimary} />
          </Pressable>
        }
      />

      {newPost.notice ? (
        <Pressable onPress={newPost.clearNotice} style={styles.notice} accessibilityLiveRegion="polite">
          <AppText variant="caption" color="danger" align="center">
            {newPost.notice}
          </AppText>
        </Pressable>
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} onPress={openPost} onAuthorPress={openProfile} />}
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
                <Button title="Criar publicação" onPress={newPost.open} />
              )}
            </View>
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.more} /> : undefined
        }
      />

      {newPost.ui}
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
});
