import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Icon, type IconName } from '@/components/ui';
import { signOut } from '@/features/auth/api';
import { colors, radius, spacing } from '@/theme';

type Props = { visible: boolean; onClose: () => void };

// Temporary menu behind the gear until the Configurações screens arrive.
export function SettingsSheet({ visible, onClose }: Props) {
  const items: { icon: IconName; label: string; onPress: () => void; danger?: boolean }[] = [
    {
      icon: 'edit',
      label: 'Editar perfil',
      onPress: () => {
        onClose();
        router.push('/editar-perfil');
      },
    },
    {
      icon: 'logout',
      label: 'Sair',
      danger: true,
      onPress: () => {
        onClose();
        signOut();
      },
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Configurações">
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Icon name={item.icon} size={22} color={item.danger ? colors.danger : colors.text} />
            <AppText variant="bodyStrong" color={item.danger ? 'danger' : 'text'}>
              {item.label}
            </AppText>
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
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.surface },
});
