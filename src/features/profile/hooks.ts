import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { FEED_PAGE_SIZE, fetchAuthorPosts, type FeedCursor } from '@/features/posts/api';
import { fetchMyProfile, fetchProfile, fetchProfileStats } from './api';

export const profileKeys = {
  me: (userId: string | undefined) => ['profile', 'me', userId] as const,
  public: (id: string) => ['profile', 'public', id] as const,
  stats: (id: string) => ['profile', 'stats', id] as const,
  // Under "posts" so creating / deleting posts refreshes the profile tabs too.
  posts: (id: string, projects: boolean) => ['posts', 'author', id, projects] as const,
};

export function useMyProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: profileKeys.me(userId),
    queryFn: () => fetchMyProfile(userId!),
    enabled: !!userId,
  });
}

export function useProfile(id: string) {
  return useQuery({ queryKey: profileKeys.public(id), queryFn: () => fetchProfile(id) });
}

export function useProfileStats(id: string, enabled = true) {
  return useQuery({ queryKey: profileKeys.stats(id), queryFn: () => fetchProfileStats(id), enabled });
}

// Vídeos tab (projects = false) or Projetos tab (projects = true).
export function useProfilePosts(id: string, projects: boolean, enabled = true) {
  return useInfiniteQuery({
    queryKey: profileKeys.posts(id, projects),
    queryFn: ({ pageParam }) => fetchAuthorPosts(id, projects, pageParam),
    initialPageParam: null as FeedCursor,
    getNextPageParam: (last) => {
      if (last.length < FEED_PAGE_SIZE) return undefined;
      const tail = last[last.length - 1];
      return { createdAt: tail.created_at, id: tail.id };
    },
    enabled,
  });
}
