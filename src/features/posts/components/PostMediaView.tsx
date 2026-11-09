import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { PostMedia } from '../types';

type Source = { kind: 'image' | 'video'; uri: string; posterUri?: string | null; width?: number | null; height?: number | null };

type Props = {
  items: Source[];
  width: number;
  height: number;
  // Only the visible page plays (carousel).
  active?: boolean;
};

// Full-size media of a post: one photo, one video, or a swipeable carousel
// with dots. Used by the open post and the "Publicar" preview.
export function PostMediaView({ items, width, height, active = true }: Props) {
  const [page, setPage] = useState(0);

  if (items.length === 1) {
    return <MediaItem item={items[0]} width={width} height={height} playing={active} />;
  }

  return (
    <View style={{ width, height }}>
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => `${i}-${item.uri}`}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <MediaItem item={item} width={width} height={height} playing={active && index === page} />
        )}
      />
      <View style={styles.dots} pointerEvents="none" accessibilityLabel={`${page + 1} de ${items.length}`}>
        {items.map((item, i) => (
          <View key={`${i}-${item.uri}`} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function fit(item: Source): 'cover' | 'contain' {
  // Vertical media fills the screen (as in Figma); other shapes are shown whole.
  if (!item.width || !item.height) return 'cover';
  return item.height >= item.width ? 'cover' : 'contain';
}

function MediaItem({ item, width, height, playing }: { item: Source; width: number; height: number; playing: boolean }) {
  const box: ViewStyle = { width, height, backgroundColor: colors.black };
  if (item.kind === 'image') {
    return (
      <View style={box}>
        <Image source={item.uri} style={StyleSheet.absoluteFill} contentFit={fit(item)} transition={150} />
      </View>
    );
  }
  return <VideoItem item={item} style={box} playing={playing} />;
}

function VideoItem({ item, style, playing }: { item: Source; style: ViewStyle; playing: boolean }) {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = true;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [paused, setPaused] = useState(false);

  // Play while visible and not paused by the user.
  const shouldPlay = playing && !paused;
  useEffect(() => {
    if (shouldPlay) player.play();
    else player.pause();
  }, [shouldPlay, player]);

  return (
    <Pressable
      style={style}
      onPress={() => setPaused((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
    >
      {item.posterUri ? (
        <Image source={item.posterUri} style={StyleSheet.absoluteFill} contentFit={fit(item)} />
      ) : null}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={fit(item)} nativeControls={false} />
      {!isPlaying ? (
        <View style={styles.play} pointerEvents="none">
          <Icon name="play" size={28} color={colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function toSources(media: PostMedia[], url: (path: string) => string): Source[] {
  return media.map((m) => ({
    kind: m.kind,
    uri: url(m.path),
    posterUri: m.thumbnail_path ? url(m.thumbnail_path) : null,
    width: m.width,
    height: m.height,
  }));
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: colors.white },
  play: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
