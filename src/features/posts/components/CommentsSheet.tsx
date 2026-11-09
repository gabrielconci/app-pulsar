import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Avatar, BottomSheet, Icon } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { avatarUrl } from '@/features/profile/api';
import { useMyProfile } from '@/features/profile/hooks';
import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing, textVariants, touchTarget } from '@/theme';
import { addComment, deleteComment } from '../api';
import { patchPost, postKeys, useComments, useToggleCommentLike } from '../hooks';
import { commentSchema } from '../schemas';
import type { Comment, Post } from '../types';

type Props = { post: Post; visible: boolean; onClose: () => void };

// "Comentários": list with a heart per comment and the "Adicionar
// comentário" field. Long-press your own comment to delete it.
export function CommentsSheet({ post, visible, onClose }: Props) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const me = useMyProfile().data;
  const comments = useComments(post.id, visible);
  const toggleLike = useToggleCommentLike(post.id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (delta: number) => {
    patchPost(queryClient, post.id, (p) => ({ ...p, comments_count: Math.max(0, p.comments_count + delta) }));
    await queryClient.invalidateQueries({ queryKey: postKeys.comments(post.id) });
  };

  const send = async () => {
    const parsed = commentSchema.safeParse(text);
    if (!parsed.success) {
      if (text.trim()) setError(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await addComment(post.id, parsed.data);
      setText('');
      await refresh(1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (comment: Comment) => {
    if (comment.author_id !== session?.user.id) return;
    Alert.alert('Excluir comentário?', undefined, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(comment.id);
            await refresh(-1);
          } catch (e) {
            setError(errorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Comentários" maxHeightRatio={0.75} contentStyle={styles.content}>
      {comments.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.empty} />
      ) : (
        <FlatList
          data={comments.data}
          keyExtractor={(c) => c.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AppText variant="body" color="text3" align="center" style={styles.empty}>
              {comments.isError ? errorMessage(comments.error) : 'Seja a primeira pessoa a comentar.'}
            </AppText>
          }
          renderItem={({ item }) => {
            const name = item.author_full_name ?? item.author_username;
            return (
              <Pressable onLongPress={() => confirmDelete(item)} delayLongPress={400} style={styles.row}>
                <Avatar uri={avatarUrl(item.author_avatar_path)} name={name} size={36} ring={false} />
                <View style={styles.texts}>
                  <AppText variant="bodyStrong">{name}</AppText>
                  <AppText variant="body" color="text2">
                    {item.body}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.liked_by_me ? 'Descurtir comentário' : 'Curtir comentário'}
                  accessibilityState={{ selected: item.liked_by_me }}
                  onPress={() => toggleLike.mutate({ commentId: item.id, liked: !item.liked_by_me })}
                  style={styles.heart}
                >
                  <Icon
                    name={item.liked_by_me ? 'heart-filled' : 'heart'}
                    size={18}
                    color={item.liked_by_me ? colors.primary : colors.text2}
                  />
                  {item.likes_count > 0 ? (
                    <AppText variant="caption" color="text3">
                      {item.likes_count}
                    </AppText>
                  ) : null}
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.composer}>
        {error ? (
          <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
        <View style={styles.inputRow}>
          <Avatar uri={avatarUrl(me?.avatar_path)} name={me?.full_name} size={36} ring={false} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Adicionar comentário"
            placeholderTextColor={colors.text3}
            cursorColor={colors.primary}
            selectionColor={colors.primarySoft}
            accessibilityLabel="Adicionar comentário"
            maxLength={1000}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar comentário"
            onPress={send}
            disabled={sending || !text.trim()}
            style={styles.send}
          >
            {sending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Icon name="send" size={22} color={text.trim() ? colors.primary : colors.text3} />
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flexShrink: 1 },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.lg },
  empty: { paddingVertical: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  texts: { flex: 1, gap: spacing.xxs },
  heart: { minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.surface2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    ...textVariants.input,
    flex: 1,
    color: colors.text,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  send: { width: touchTarget - 8, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
