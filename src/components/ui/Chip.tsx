import { Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

// Pill used for interests. Selected = orange.
export function Chip({ label, selected, disabled, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.idle,
        pressed && !selected && { backgroundColor: colors.surface2 },
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="bodyStrong" color={selected ? 'onPrimary' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.surface2 },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.4 },
});
