import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePreventRemove } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, KeyboardScroll } from '@/components/layout';
import { AppText, Button, ConfirmDialog, Icon } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { createPost } from '@/features/posts/api';
import { PostTextFields, type PostTextForm } from '@/features/posts/components/PostTextFields';
import { postKeys } from '@/features/posts/hooks';
import { MediaError, pickMedia, prepareMedia } from '@/features/posts/media';
import { postTextSchema } from '@/features/posts/schemas';
import type { LocalMedia } from '@/features/posts/types';
import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';

// Cover + 2 more images (a project has 1 to 3 images).
type Slots = [LocalMedia | null, LocalMedia | null, LocalMedia | null];

// "Novo projeto" (Figma section): cover, two extra images, title, subtitle,
// text and caption. Leaving with something filled asks
// "Deseja abandonar o projeto?".
export default function NewProjectScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [slots, setSlots] = useState<Slots>([null, null, null]);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Blocked "back" waiting for the dialog answer.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  // Exit to run once leaving is allowed (after "Abandonar" or publishing).
  const [exit, setExit] = useState<(() => void) | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PostTextForm>({
    resolver: zodResolver(postTextSchema(true)),
    defaultValues: { title: '', subtitle: '', body: '', caption: '' },
  });

  const hasContent = isDirty || slots.some(Boolean);

  usePreventRemove(hasContent && !exit, ({ repeat }) => {
    setPendingLeave(() => repeat);
    setConfirmLeave(true);
  });

  // Runs the exit once prevention is off.
  useEffect(() => {
    exit?.();
  }, [exit]);

  const pickSlot = async (index: number) => {
    setFormError(null);
    try {
      const assets = await pickMedia('project', 1);
      if (!assets) return;
      setLoadingSlot(index);
      const [media] = await prepareMedia(assets);
      setSlots((s) => s.map((m, i) => (i === index ? media : m)) as Slots);
    } catch (e) {
      setFormError(e instanceof MediaError ? e.message : errorMessage(e));
    } finally {
      setLoadingSlot(null);
    }
  };

  const removeSlot = (index: number) => setSlots((s) => s.map((m, i) => (i === index ? null : m)) as Slots);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!slots[0]) {
      setFormError('Adicione a capa do projeto.');
      return;
    }
    try {
      const media = slots.filter((m): m is LocalMedia => !!m);
      await createPost(session!.user.id, { type: 'project', media, ...values }, (done, total) =>
        setProgress({ done, total }),
      );
      await queryClient.invalidateQueries({ queryKey: postKeys.feed });
      setExit(() => () => router.back());
    } catch (error) {
      setFormError(errorMessage(error));
      setProgress(null);
    }
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader onBack />
      <KeyboardScroll contentStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <AppText variant="title">Novo projeto</AppText>

        <View style={styles.group}>
          <AppText variant="label">Capa do projeto</AppText>
          <ImageSlot media={slots[0]} loading={loadingSlot === 0} onPick={() => pickSlot(0)} style={styles.cover} />
        </View>

        <View style={styles.group}>
          <AppText variant="label">Mais imagens (opcional)</AppText>
          <View style={styles.row}>
            {[1, 2].map((i) => (
              <ImageSlot
                key={i}
                media={slots[i]}
                loading={loadingSlot === i}
                onPick={() => pickSlot(i)}
                onRemove={() => removeSlot(i)}
                style={styles.extra}
              />
            ))}
          </View>
        </View>

        <PostTextFields control={control} errors={errors} isProject />

        {formError ? (
          <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}
        {progress ? (
          <AppText variant="caption" color="text2" align="center" accessibilityLiveRegion="polite">
            {progress.done < progress.total ? `Enviando ${progress.done + 1} de ${progress.total}…` : 'Publicando…'}
          </AppText>
        ) : null}
        <Button title="Publicar" onPress={onSubmit} loading={isSubmitting} disabled={loadingSlot !== null} />
      </KeyboardScroll>

      <ConfirmDialog
        visible={confirmLeave}
        message="Deseja abandonar o projeto?"
        confirmLabel="Abandonar"
        onCancel={() => {
          setPendingLeave(null);
          setConfirmLeave(false);
        }}
        onConfirm={() => {
          setConfirmLeave(false);
          setExit(() => pendingLeave);
        }}
      />
    </View>
  );
}

type SlotProps = {
  media: LocalMedia | null;
  loading: boolean;
  onPick: () => void;
  onRemove?: () => void;
  style: object;
};

// Image box: empty with "Adicionar", or the photo with "Editar" (Figma).
function ImageSlot({ media, loading, onPick, onRemove, style }: SlotProps) {
  return (
    <View style={[styles.slot, style]}>
      {media ? (
        <Image source={media.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="image" size={44} color={colors.text3} />
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(20,19,18,0.75)']} locations={[0.55, 1]} style={StyleSheet.absoluteFill} />
      {loading ? (
        <ActivityIndicator color={colors.white} style={styles.slotAction} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={media ? 'Trocar imagem' : 'Adicionar imagem'}
          onPress={onPick}
          style={[styles.slotAction, styles.slotButton, media ? styles.editButton : styles.addButton]}
        >
          <AppText variant="captionStrong" color={media ? 'text' : 'onPrimary'}>
            {media ? 'Editar' : 'Adicionar'}
          </AppText>
        </Pressable>
      )}
      {media && onRemove && !loading ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Remover imagem" onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Icon name="close" size={16} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.form, paddingTop: spacing.lg, gap: spacing.xl },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  slot: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#4F4E4D' },
  cover: { width: '100%', aspectRatio: 1.05 },
  extra: { flex: 1, aspectRatio: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.xl },
  slotAction: { position: 'absolute', bottom: spacing.md, alignSelf: 'center' },
  slotButton: { minHeight: 32, paddingHorizontal: spacing.lg, borderRadius: radius.pill, justifyContent: 'center' },
  addButton: { backgroundColor: colors.primary },
  editButton: { backgroundColor: colors.white },
  remove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
