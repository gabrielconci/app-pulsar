import type { LocalMedia, PostType } from './types';

// The post being created, kept in memory between "escolher mídia" and
// "Publicar" (files are local URIs, so they don't go in the route URL).
type Draft = { type: Exclude<PostType, 'project'>; media: LocalMedia[] };

let draft: Draft | null = null;

export const postDraft = {
  set(value: Draft) {
    draft = value;
  },
  get(): Draft | null {
    return draft;
  },
  clear() {
    draft = null;
  },
};
