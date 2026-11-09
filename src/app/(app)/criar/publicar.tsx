import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, KeyboardScroll } from '@/components/layout';
import { AppText, Button } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { createPost } from '@/features/posts/api';
import { PostMediaView } from '@/features/posts/components/PostMediaView';
import { PostTextFields, type PostTextForm } from '@/features/posts/components/PostTextFields';
import { postDraft } from '@/features/posts/draft';
import { postKeys } from '@/features/posts/hooks';
import { postTextSchema } from '@/features/posts/schemas';
import { errorMessage } from '@/lib/errors';
import { colors, spacing } from '@/theme';

const TITLES = { video: 'Novo vídeo', photo: 'Nova foto', carousel: 'Novo carrossel' } as const;

// Last step for video, photo and carousel posts: preview, optional caption
// and "Publicar". Not in Figma; follows the style of the other screens.
export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [draft] = useState(() => postDraft.get());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostTextForm>({
    resolver: zodResolver(postTextSchema(false)),
    defaultValues: { title: '', subtitle: '', body: '', caption: '' },
  });

  const previewWidth = width - spacing.form * 2;

  const onSubmit = handleSubmit(async ({ caption }) => {
    if (!draft) return;
    setFormError(null);
    try {
      await createPost(session!.user.id, { type: draft.type, media: draft.media, caption }, (done, total) =>
        setProgress({ done, total }),
      );
      postDraft.clear();
      await queryClient.invalidateQueries({ queryKey: postKeys.feed });
      router.back();
    } catch (error) {
      setFormError(errorMessage(error));
      setProgress(null);
    }
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader onBack={isSubmitting ? () => {} : true} />
      {!draft ? (
        <View style={styles.missing}>
          <AppText variant="body" color="text2" align="center">
            Nada para publicar. Volte e escolha uma mídia.
          </AppText>
          <Button title="Voltar" onPress={() => router.back()} />
        </View>
      ) : (
        <KeyboardScroll contentStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
          <AppText variant="title">{TITLES[draft.type]}</AppText>
          <View style={styles.preview}>
            <PostMediaView
              items={draft.media.map((m) => ({
                kind: m.kind,
                uri: m.uri,
                posterUri: m.thumbnailUri,
                width: m.width,
                height: m.height,
              }))}
              width={previewWidth}
              height={Math.round(previewWidth * 1.28)}
            />
          </View>
          <PostTextFields control={control} errors={errors} isProject={false} />
          {formError ? (
            <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
              {formError}
            </AppText>
          ) : null}
          {progress ? (
            <AppText variant="caption" color="text2" align="center" accessibilityLiveRegion="polite">
              {progress.done < progress.total
                ? `Enviando ${progress.done + 1} de ${progress.total}…`
                : 'Publicando…'}
            </AppText>
          ) : null}
          <Button title="Publicar" onPress={onSubmit} loading={isSubmitting} />
        </KeyboardScroll>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.form, paddingTop: spacing.lg, gap: spacing.xl },
  preview: { borderRadius: 4, overflow: 'hidden', backgroundColor: colors.black },
  missing: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.form },
});
