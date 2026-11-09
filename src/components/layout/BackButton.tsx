import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, touchTarget } from '@/theme';

type Props = {
  onPress?: () => void;
  // White on top of photos, dark on white screens.
  tone?: 'dark' | 'light';
};

export function BackButton({ onPress, tone = 'dark' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      onPress={onPress ?? (() => router.back())}
      hitSlop={8}
      style={styles.button}
    >
      <Icon name="chevron-left" size={26} color={tone === 'light' ? colors.white : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
