import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import {
  FEED_PAGE_SIZE,
  fetchComments,
  fetchFeed,
  fetchPost,
  setClap,
  setCommentLike,
  type FeedCursor,
} from './api';
import type { Comment, Post } from './types';

export const postKeys = {
  all: ['posts'] as const,
  feed: ['posts', 'feed'] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
  comments: (id: string) => ['comments', id] as const,
};

export function useFeed() {
  return useInfiniteQuery({
    queryKey: postKeys.feed,
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: null as FeedCursor,
    getNextPageParam: (last) => {
      if (last.length < FEED_PAGE_SIZE) return undefined;
      const tail = last[last.length - 1];
      return { createdAt: tail.created_at, id: tail.id };
    },
  });
}

export function usePost(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPost(id),
    // Show the card's data right away when coming from the feed.
    initialData: () => findInFeed(queryClient, id),
    initialDataUpdatedAt: () => queryClient.getQueryState(postKeys.feed)?.dataUpdatedAt,
  });
}

function findInFeed(queryClient: QueryClient, id: string): Post | undefined {
  const feed = queryClient.getQueryData<InfiniteData<Post[]>>(postKeys.feed);
  return feed?.pages.flat().find((p) => p.id === id);
}

// Applies a change to a post everywhere it is cached (feed and open post).
export function patchPost(queryClient: QueryClient, id: string, change: (post: Post) => Post) {
  queryClient.setQueryData<InfiniteData<Post[]>>(postKeys.feed, (feed) =>
    feed && { ...feed, pages: feed.pages.map((page) => page.map((p) => (p.id === id ? change(p) : p))) },
  );
  queryClient.setQueryData<Post | null>(postKeys.detail(id), (post) => (post ? change(post) : post));
}

export function removePostFromCache(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<InfiniteData<Post[]>>(postKeys.feed, (feed) =>
    feed && { ...feed, pages: feed.pages.map((page) => page.filter((p) => p.id !== id)) },
  );
  queryClient.removeQueries({ queryKey: postKeys.detail(id) });
}

const withClap = (clapped: boolean) => (p: Post): Post => ({
  ...p,
  clapped_by_me: clapped,
  claps_count: Math.max(0, p.claps_count + (clapped ? 1 : -1)),
});

// Aclamar: updates the screen at once and rolls back if the server fails.
export function useToggleClap(post: Post | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clapped: boolean) => setClap(post!.id, clapped),
    onMutate: (clapped) => patchPost(queryClient, post!.id, withClap(clapped)),
    onError: (_e, clapped) => patchPost(queryClient, post!.id, withClap(!clapped)),
  });
}

export function useComments(postId: string, enabled: boolean) {
  return useQuery({ queryKey: postKeys.comments(postId), queryFn: () => fetchComments(postId), enabled });
}

export function useToggleCommentLike(postId: string) {
  const queryClient = useQueryClient();
  const apply = (commentId: string, liked: boolean) =>
    queryClient.setQueryData<Comment[]>(postKeys.comments(postId), (list) =>
      list?.map((c) =>
        c.id === commentId
          ? { ...c, liked_by_me: liked, likes_count: Math.max(0, c.likes_count + (liked ? 1 : -1)) }
          : c,
      ),
    );
  return useMutation({
    mutationFn: ({ commentId, liked }: { commentId: string; liked: boolean }) => setCommentLike(commentId, liked),
    onMutate: ({ commentId, liked }) => apply(commentId, liked),
    onError: (_e, { commentId, liked }) => apply(commentId, !liked),
  });
}
