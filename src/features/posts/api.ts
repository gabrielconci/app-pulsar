import { readLocalFile } from '@/lib/files';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';
import type { Comment, LocalMedia, Post, PostType } from './types';

const BUCKET = 'post-media';
export const FEED_PAGE_SIZE = 10;

export type FeedCursor = { createdAt: string; id: string } | null;

function toPost(row: Record<string, unknown>): Post {
  return row as unknown as Post;
}

export async function fetchFeed(cursor: FeedCursor): Promise<Post[]> {
  const { data, error } = await supabase.rpc('get_posts', {
    p_limit: FEED_PAGE_SIZE,
    p_before_created_at: cursor?.createdAt,
    p_before_id: cursor?.id,
  });
  if (error) throw error;
  return data.map(toPost);
}

export async function fetchPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase.rpc('get_posts', { p_post_id: id, p_limit: 1 });
  if (error) throw error;
  return data[0] ? toPost(data[0]) : null;
}

export function mediaUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'video/mp4':
      return 'mp4';
    case 'video/quicktime':
      return 'mov';
    default:
      return 'jpg';
  }
}

async function uploadFile(path: string, uri: string, contentType: string) {
  const file = await readLocalFile(uri);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType });
  if (error) throw error;
}

export type CreatePostInput = {
  type: PostType;
  media: LocalMedia[];
  title?: string;
  subtitle?: string;
  body?: string;
  caption?: string;
};

// Uploads every file to "post-media/<user id>/..." and then creates the post.
// If anything fails, the files already sent are removed.
export async function createPost(
  userId: string,
  input: CreatePostInput,
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  const stamp = Date.now();
  const uploaded: string[] = [];
  const total = input.media.length;

  try {
    const items: Json[] = [];
    for (const [i, item] of input.media.entries()) {
      onProgress?.(i, total);
      const path = `${userId}/${stamp}-${i}.${extensionFor(item.mimeType)}`;
      await uploadFile(path, item.uri, item.mimeType);
      uploaded.push(path);

      let thumbnailPath: string | null = null;
      if (item.kind === 'video' && item.thumbnailUri) {
        thumbnailPath = `${userId}/${stamp}-${i}-capa.jpg`;
        await uploadFile(thumbnailPath, item.thumbnailUri, 'image/jpeg');
        uploaded.push(thumbnailPath);
      }

      items.push({
        path,
        kind: item.kind,
        width: item.width || null,
        height: item.height || null,
        duration_ms: item.kind === 'video' ? Math.max(1, Math.round(item.durationMs ?? 0)) : null,
        thumbnail_path: thumbnailPath,
      });
    }
    onProgress?.(total, total);

    const { data, error } = await supabase.rpc('create_post', {
      p_type: input.type,
      p_media: items,
      p_title: input.title,
      p_subtitle: input.subtitle,
      p_body: input.body,
      p_caption: input.caption,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
    throw error;
  }
}

export type UpdatePostInput = { caption: string; title?: string; subtitle?: string; body?: string };

export async function updatePost(post: Post, input: UpdatePostInput) {
  const isProject = post.type === 'project';
  const { error } = await supabase
    .from('posts')
    .update({
      caption: input.caption.trim() || null,
      ...(isProject && {
        title: input.title?.trim(),
        subtitle: input.subtitle?.trim() || null,
        body: input.body?.trim(),
      }),
    })
    .eq('id', post.id);
  if (error) throw error;
}

// Deletes the post (claps, views and comments go with it) and its files.
export async function deletePost(post: Post) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) throw error;
  const files = post.media.flatMap((m) => (m.thumbnail_path ? [m.path, m.thumbnail_path] : [m.path]));
  // The post is already gone; leftover files don't block the user.
  await supabase.storage.from(BUCKET).remove(files);
}

export async function setClap(postId: string, clapped: boolean) {
  const { error } = clapped
    ? await supabase.from('post_claps').insert({ post_id: postId })
    : await supabase.from('post_claps').delete().eq('post_id', postId);
  // Already clapped (double tap race): fine.
  if (error && error.code !== '23505') throw error;
}

export async function recordView(postId: string) {
  const { error } = await supabase.rpc('record_post_view', { p_post_id: postId });
  if (error) throw error;
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase.rpc('get_comments', { p_post_id: postId });
  if (error) throw error;
  return data;
}

export async function addComment(postId: string, body: string) {
  const { error } = await supabase.from('comments').insert({ post_id: postId, body: body.trim() });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function setCommentLike(commentId: string, liked: boolean) {
  const { error } = liked
    ? await supabase.from('comment_likes').insert({ comment_id: commentId })
    : await supabase.from('comment_likes').delete().eq('comment_id', commentId);
  if (error && error.code !== '23505') throw error;
}
