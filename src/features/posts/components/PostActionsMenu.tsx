import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, radius, spacing, touchTarget } from '@/theme';

export type PostAction = 'clap' | 'description' | 'comments' | 'share' | 'edit' | 'delete';

type Props = {
  clapped: boolean;
  // Editar and Excluir only show on the user's own posts.
  isOwner: boolean;
  onAction: (action: PostAction) => void;
};

const ITEMS: { action: PostAction; icon: IconName; label: string; ownerOnly?: boolean }[] = [
  { action: 'clap', icon: 'clap', label: 'Aclamar' },
  { action: 'description', icon: 'description', label: 'Descrição' },
  { action: 'comments', icon: 'comment', label: 'Comentários' },
  { action: 'share', icon: 'send', label: 'Compartilhar' },
  { action: 'edit', icon: 'edit', label: 'Editar', ownerOnly: true },
  { action: 'delete', icon: 'trash', label: 'Excluir', ownerOnly: true },
];

// The ⋮ button of the open post. It opens the vertical bar of actions shown
// in Figma (Frame 809): aclamar, descrição, comentários, compartilhar and,
// on your own posts, editar and excluir.
export function PostActionsMenu({ clapped, isOwner, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const items = ITEMS.filter((item) => isOwner || !item.ownerOnly);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open ? (
        <View style={styles.bar}>
          {items.map((item) => {
            const active = item.action === 'clap' && clapped;
            return (
              <Pressable
                key={item.action}
                accessibilityRole="button"
                accessibilityLabel={active ? 'Remover aclamação' : item.label}
                accessibilityState={item.action === 'clap' ? { selected: clapped } : undefined}
                onPress={() => {
                  // Aclamar keeps the bar open; the others open a sheet or screen.
                  if (item.action !== 'clap') setOpen(false);
                  onAction(item.action);
                }}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <Icon name={item.icon} size={24} color={active ? colors.primary : colors.white} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Fechar ações' : 'Ações da publicação'}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.more, pressed && styles.pressed]}
      >
        <Icon name={open ? 'close' : 'more-vertical'} size={22} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  bar: {
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'rgba(90, 88, 86, 0.9)',
  },
  item: { width: touchTarget, height: touchTarget + 4, alignItems: 'center', justifyContent: 'center' },
  more: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(26, 25, 24, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
