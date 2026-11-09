import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Icon, type IconName } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { PostType } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PostType) => void;
};

const TYPES: { type: PostType; icon: IconName; label: string; hint: string }[] = [
  { type: 'video', icon: 'video', label: 'Vídeo', hint: 'Até 30 segundos' },
  { type: 'photo', icon: 'image', label: 'Foto', hint: 'Uma imagem' },
  { type: 'carousel', icon: 'carousel', label: 'Carrossel', hint: 'De 2 a 10 fotos ou vídeos' },
  { type: 'project', icon: 'project', label: 'Projeto', hint: 'Capa, texto e até 3 imagens' },
];

// "Nova publicação": choose the kind of post. Not in Figma; follows the
// style of the other sheets.
export function NewPostSheet({ visible, onClose, onSelect }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Nova publicação">
      <View style={styles.list}>
        {TYPES.map((item) => (
          <Pressable
            key={item.type}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}. ${item.hint}`}
            onPress={() => onSelect(item.type)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.icon}>
              <Icon name={item.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.texts}>
              <AppText variant="bodyStrong">{item.label}</AppText>
              <AppText variant="caption" color="text2">
                {item.hint}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.surface },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xxs },
});
