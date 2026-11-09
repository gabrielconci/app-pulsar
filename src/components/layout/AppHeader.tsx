import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { BackButton } from './BackButton';
import { Logo } from './Logo';

type Props = {
  // Shows the back arrow. Pass a function to override the default (router.back).
  onBack?: (() => void) | true;
  // Content on the right side (e.g. the "+" button on Home).
  right?: ReactNode;
};

// Top bar with the PULSAR logo centered and an optional back arrow.
export function AppHeader({ onBack, right }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        {onBack ? <BackButton onPress={onBack === true ? undefined : onBack} /> : null}
      </View>
      <Logo />
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
});
