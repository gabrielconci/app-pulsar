import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import type { LocalMedia, PostType } from './types';

export const MAX_VIDEO_MS = 30_000;
export const MAX_CAROUSEL_ITEMS = 10;
// Same cap as the "post-media" bucket (Supabase free plan).
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
// Longest side of uploaded photos.
const MAX_IMAGE_SIDE = 1440;

// Error with a message ready to show to the user.
export class MediaError extends Error {}

// Opens the phone's photo picker for the given post type. Returns null when
// the user cancels.
export async function pickMedia(type: PostType, limit = MAX_CAROUSEL_ITEMS): Promise<ImagePicker.ImagePickerAsset[] | null> {
  const multiple = type === 'carousel' || (type === 'project' && limit > 1);
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: type === 'video' ? ['videos'] : type === 'carousel' ? ['images', 'videos'] : ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? limit : 1,
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets.slice(0, limit);
}

// Turns picked files into upload-ready media: photos are resized and
// compressed; videos are checked (≤ 30 s, mp4/mov, ≤ 50 MB) and get a cover.
export async function prepareMedia(assets: ImagePicker.ImagePickerAsset[]): Promise<LocalMedia[]> {
  const out: LocalMedia[] = [];
  for (const asset of assets) {
    out.push(asset.type === 'video' ? await prepareVideo(asset) : await prepareImage(asset));
  }
  return out;
}

async function prepareImage(asset: ImagePicker.ImagePickerAsset): Promise<LocalMedia> {
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > MAX_IMAGE_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_IMAGE_SIDE, height: null } : { width: null, height: MAX_IMAGE_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  return { uri: saved.uri, kind: 'image', mimeType: 'image/jpeg', width: saved.width, height: saved.height };
}

function waitUntilReady(player: VideoPlayer): Promise<void> {
  if (player.status === 'readyToPlay') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        sub.remove();
        resolve();
      } else if (status === 'error') {
        sub.remove();
        reject(new MediaError('Não foi possível abrir esse vídeo.'));
      }
    });
  });
}

async function prepareVideo(asset: ImagePicker.ImagePickerAsset): Promise<LocalMedia> {
  const mimeType = asset.mimeType ?? 'video/mp4';
  if (!VIDEO_TYPES.includes(mimeType)) {
    throw new MediaError('Formato de vídeo não aceito. Use vídeos MP4 ou MOV.');
  }
  if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
    throw new MediaError('Vídeo muito grande. O limite é 50 MB.');
  }

  const player = createVideoPlayer(asset.uri);
  try {
    await waitUntilReady(player);
    const durationMs = asset.duration ?? player.duration * 1000;
    if (durationMs > MAX_VIDEO_MS + 500) {
      throw new MediaError('O vídeo pode ter no máximo 30 segundos.');
    }
    const [frame] = await player.generateThumbnailsAsync(0, { maxWidth: 1080 });
    const cover = await ImageManipulator.manipulate(frame).renderAsync();
    const saved = await cover.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return {
      uri: asset.uri,
      kind: 'video',
      mimeType,
      width: asset.width || saved.width,
      height: asset.height || saved.height,
      durationMs: Math.min(durationMs, MAX_VIDEO_MS),
      thumbnailUri: saved.uri,
    };
  } finally {
    player.release();
  }
}
