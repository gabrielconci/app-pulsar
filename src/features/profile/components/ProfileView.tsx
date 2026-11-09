import { router } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '@/components/ui';
import { MediaGridCard, ProjectCard } from '@/features/posts/components/ProfilePostCards';
import type { Post } from '@/features/posts/types';
import { errorMessage } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import { useProfile, useProfilePosts, useProfileStats } from '../hooks';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStats } from './ProfileStats';
import { ProfileTabs, type ProfileTab } from './ProfileTabs';

type Props = {
  profileId: string;
  // Your own profile shows the "+" (new post).
  onAdd?: () => void;
  // Extra content under the tabs (e.g. a notice from the new post flow).
  notice?: ReactNode;
};

// Body of a profile, shared by the Perfil tab and other people's profiles:
// header, tabs, and the Vídeos grid / Projetos list / Estatísticas.
export function ProfileView({ profileId, onAdd, notice }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Two columns with 12 pt around and between them.
  const cardWidth = (width - spacing.md * 3) / 2;
  const [tab, setTab] = useState<ProfileTab>('videos');
  const profile = useProfile(profileId);
  const media = useProfilePosts(profileId, false, tab === 'videos');
  const projects = useProfilePosts(profileId, true, tab === 'projects');
  const stats = useProfileStats(profileId, tab === 'stats');

  const openPost = useCallback((post: Post) => {
    router.push({ pathname: '/post/[id]', params: { id: post.id } });
  }, []);

  if (!profile.data) {
    return (
      <View style={styles.center}>
        {profile.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <AppText variant="body" color="text2" align="center">
            {profile.isError ? errorMessage(profile.error) : 'Perfil não encontrado.'}
          </AppText>
        )}
      </View>
    );
  }

  const list = tab === 'projects' ? projects : media;
  const posts = tab === 'stats' ? [] : (list.data?.pages.flat() ?? []);

  const refresh = () => {
    profile.refetch();
    if (tab === 'stats') stats.refetch();
    else list.refetch();
  };

  const header = (
    <View style={styles.header}>
      <ProfileHeader profile={profile.data} />
      <ProfileTabs tab={tab} onChange={setTab} onAdd={onAdd} />
      {notice}
    </View>
  );

  const empty =
    tab === 'stats' ? (
      <ProfileStats stats={stats.data} loading={stats.isPending} />
    ) : list.isPending ? (
      <ActivityIndicator color={colors.primary} style={styles.loading} />
    ) : (
      <View style={styles.empty}>
        <AppText variant="body" color="text2" align="center">
          {list.isError
            ? errorMessage(list.error)
            : tab === 'projects'
              ? 'Nenhum projeto ainda.'
              : 'Nenhum vídeo ou foto ainda.'}
        </AppText>
        {onAdd && !list.isError ? <Button title="Criar publicação" onPress={onAdd} /> : null}
      </View>
    );

  const isGrid = tab === 'videos';

  return (
    <FlatList
      // Grid and list need separate instances (numColumns can't change).
      key={tab}
      data={posts}
      keyExtractor={(p) => p.id}
      numColumns={isGrid ? 2 : 1}
      columnWrapperStyle={isGrid ? styles.gridRow : undefined}
      renderItem={({ item }) =>
        isGrid ? <MediaGridCard post={item} onPress={openPost} width={cardWidth} /> : <ProjectCard post={item} onPress={openPost} />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ItemSeparatorComponent={isGrid ? GridGap : ListGap}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      onEndReached={() => {
        if (tab !== 'stats' && list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl refreshing={profile.isRefetching} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListFooterComponent={
        list.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : undefined
      }
    />
  );
}

function GridGap() {
  return <View style={{ height: spacing.md }} />;
}

function ListGap() {
  return <View style={{ height: spacing.lg }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.form },
  header: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  content: { paddingHorizontal: 0 },
  gridRow: { gap: spacing.md, paddingHorizontal: spacing.md },
  loading: { marginTop: spacing.xl },
  empty: { gap: spacing.md, paddingHorizontal: spacing.form, paddingTop: spacing.xl },
});
