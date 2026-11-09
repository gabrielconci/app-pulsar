import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Avatar, BottomSheet, Icon, type IconName } from '@/components/ui';
import { avatarUrl } from '@/features/profile/api';
import { colors, spacing } from '@/theme';
import type { Post } from '../types';

type Props = { post: Post; visible: boolean; onClose: () => void };

// "Descrição": author, the post's text, and its aclamações / público counts.
export function DescriptionSheet({ post, visible, onClose }: Props) {
  const name = post.author_full_name ?? post.author_username;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.top}>
        <View style={styles.author}>
          <Avatar uri={avatarUrl(post.author_avatar_path)} name={name} size={36} />
          <AppText variant="bodyStrong">{name}</AppText>
        </View>
        <AppText variant="body" color={post.caption ? 'text' : 'text3'} style={styles.caption}>
          {post.caption ?? 'Sem descrição.'}
        </AppText>
      </ScrollView>
      <View style={styles.divider} />
      <View style={styles.stats}>
        <Stat icon="clap" label="Aclamações" value={post.claps_count} />
        <Stat icon="eye" label="Público" value={post.views_count} />
      </View>
    </BottomSheet>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={24} color={colors.text} />
      <AppText variant="bodyStrong" style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  caption: { paddingLeft: 36 + spacing.md },
  divider: { height: 1, backgroundColor: colors.surface2 },
  stats: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xl },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  statLabel: { flex: 1, fontSize: 16 },
});
