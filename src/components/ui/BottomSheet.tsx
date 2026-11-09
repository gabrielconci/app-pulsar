import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, touchTarget } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  // Max share of the screen height (Comentários uses a taller sheet).
  maxHeightRatio?: number;
  contentStyle?: StyleProp<ViewStyle>;
};

// Sheet that slides up from the bottom, with a grab handle and a close (X)
// button, as in the Descrição / Comentários / Compartilhar frames.
// Drag the handle down or tap outside to close.
export function BottomSheet({ visible, onClose, title, children, maxHeightRatio = 0.85, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [keyboard, setKeyboard] = useState(0);
  const [translate] = useState(() => new Animated.Value(height));
  const [fade] = useState(() => new Animated.Value(0));

  // Stay mounted while the closing animation runs.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translate, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 16 }),
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translate, { toValue: height, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible, mounted, height, translate, fade]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboard(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
        onPanResponderMove: (_, g) => translate.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 100 || g.vy > 1) onClose();
          else Animated.spring(translate, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [onClose, translate],
  );

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: height * maxHeightRatio,
            paddingBottom: (keyboard || insets.bottom) + spacing.lg,
            transform: [{ translateY: translate }],
          },
        ]}
      >
        <View {...pan.panHandlers} style={styles.top}>
          <View style={styles.handle} />
          {title ? (
            <AppText variant="bodyStrong" align="center" style={styles.title} accessibilityRole="header">
              {title}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onClose}
            hitSlop={8}
            style={styles.close}
          >
            <Icon name="close" size={20} color={colors.text2} />
          </Pressable>
        </View>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  top: { paddingTop: spacing.sm, minHeight: touchTarget, justifyContent: 'center' },
  handle: { alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: colors.line },
  title: { fontSize: 17, paddingTop: spacing.md, paddingHorizontal: 56 },
  close: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.xs,
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexShrink: 1 },
});
