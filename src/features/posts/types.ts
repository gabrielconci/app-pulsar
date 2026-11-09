import type { Database } from '@/types/database';

export type PostType = Database['public']['Enums']['post_type'];

export type PostMedia = {
  position: number;
  kind: 'image' | 'video';
  path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
};

type PostRow = Database['public']['Functions']['get_posts']['Returns'][number];

// A post as returned by get_posts(), with "media" typed.
export type Post = Omit<PostRow, 'media'> & { media: PostMedia[] };

export type Comment = Database['public']['Functions']['get_comments']['Returns'][number];

// A file picked on the phone, ready to upload.
export type LocalMedia = {
  uri: string;
  kind: 'image' | 'video';
  mimeType: string;
  width: number;
  height: number;
  durationMs?: number;
  // Video cover image (local file), made before upload.
  thumbnailUri?: string;
};
