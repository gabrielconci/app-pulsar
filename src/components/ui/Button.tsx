import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, touchTarget } from '@/theme';
import { AppText } from './AppText';

type Props = {
  title: string;
  onPress?: () => void;
  // primary = orange action button; secondary = light grey (e.g. "Pular").
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const inactive = disabled || loading;
  const isPrimary = variant === 'primary' && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: isPrimary ? colors.primary : colors.surface2 },
        pressed && { backgroundColor: isPrimary ? colors.primaryPressed : colors.line },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.text} />
      ) : (
        <AppText variant="button" color={isPrimary ? 'onPrimary' : disabled ? 'text3' : 'text'}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
