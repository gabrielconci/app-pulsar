import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, KeyboardScroll } from '@/components/layout';
import { AppText, Button } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { updatePost } from '@/features/posts/api';
import { PostTextFields, type PostTextForm } from '@/features/posts/components/PostTextFields';
import { postKeys, usePost } from '@/features/posts/hooks';
import { postTextSchema } from '@/features/posts/schemas';
import type { Post } from '@/features/posts/types';
import { errorMessage } from '@/lib/errors';
import { colors, spacing } from '@/theme';

// Edit a post's text (caption; title, subtitle and text on projects).
// Photos and videos can't be changed in v1.
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { data: post } = usePost(id);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader onBack />
      {post && post.author_id === session?.user.id ? (
        <EditForm post={post} />
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      )}
    </View>
  );
}

function EditForm({ post }: { post: Post }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isProject = post.type === 'project';
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostTextForm>({
    resolver: zodResolver(postTextSchema(isProject)),
    defaultValues: {
      title: post.title ?? '',
      subtitle: post.subtitle ?? '',
      body: post.body ?? '',
      caption: post.caption ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updatePost(post, values);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.detail(post.id) }),
        queryClient.invalidateQueries({ queryKey: postKeys.feed }),
      ]);
      router.back();
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <KeyboardScroll contentStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
      <AppText variant="title">Editar publicação</AppText>
      <PostTextFields control={control} errors={errors} isProject={isProject} />
      {formError ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </AppText>
      ) : null}
      <Button title="Salvar" onPress={onSubmit} loading={isSubmitting} />
    </KeyboardScroll>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { marginTop: spacing.xxl },
  content: { paddingHorizontal: spacing.form, paddingTop: spacing.lg, gap: spacing.xl },
});
