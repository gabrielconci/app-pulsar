import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import { NewPostSheet } from './components/NewPostSheet';
import { postDraft } from './draft';
import { MediaError, pickMedia, prepareMedia } from './media';
import type { PostType } from './types';

// "Nova publicação" flow used by the "+" on Home and on Perfil: type sheet,
// photo picker, media preparation, then the Publicar / Novo projeto screen.
// Render `ui` once in the screen.
export function useNewPost() {
  const [choosing, setChoosing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const start = async (type: PostType) => {
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

  const ui = (
    <>
      <NewPostSheet visible={choosing} onClose={() => setChoosing(false)} onSelect={start} />
      {preparing ? (
        <View style={styles.overlay} accessibilityLiveRegion="polite">
          <View style={styles.card}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="body">Preparando mídia…</AppText>
          </View>
        </View>
      ) : null}
    </>
  );

  return { open: () => setChoosing(true), notice, clearNotice: () => setNotice(null), ui };
}

const styles = StyleSheet.create({
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
  card: {
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
