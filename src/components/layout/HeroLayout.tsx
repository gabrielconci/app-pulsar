import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/theme';
import { BackButton } from './BackButton';
import { KeyboardScroll } from './KeyboardScroll';

type Props = {
  image: ImageSource;
  // Share of the screen height covered by the photo.
  heroRatio?: number;
  onBack?: () => void;
  // Content between the photo and the card (e.g. "BEM VINDO AO PULSAR!").
  above?: ReactNode;
  // Wrap children in the white card (login, cadastro) or not (interesses).
  card?: boolean;
  children: ReactNode;
};

// Photo on top fading into white, content below. Used by Login, Cadastro,
// Confira seu email and Interesses.
export function HeroLayout({ image, heroRatio = 0.45, onBack, above, card = true, children }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * heroRatio);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.hero, { height: heroHeight }]}>
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(255,255,255,0)', colors.bg]}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardScroll
        contentStyle={[
          styles.content,
          { paddingTop: heroHeight * 0.72, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        {above}
        {card ? <View style={styles.card}>{children}</View> : children}
      </KeyboardScroll>

      {onBack ? (
        <View style={[styles.back, { top: insets.top + spacing.xs }]}>
          <BackButton tone="light" onPress={onBack} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { justifyContent: 'flex-end', paddingHorizontal: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl + spacing.sm,
    paddingVertical: spacing.xl + spacing.sm,
    gap: spacing.lg + spacing.xs,
    shadowColor: '#28190A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  back: { position: 'absolute', left: spacing.md },
});
