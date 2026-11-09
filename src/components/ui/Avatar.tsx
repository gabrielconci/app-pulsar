import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './AppText';

type Props = {
  uri: string | null | undefined;
  name?: string | null;
  size?: number;
  // Orange ring around the photo, as in the Home card and post bars.
  ring?: boolean;
};

// Round profile photo; shows the first letter of the name when there is none.
export function Avatar({ uri, name, size = 40, ring = true }: Props) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.base, box, ring && styles.ring]} accessibilityElementsHidden importantForAccessibility="no">
      {uri ? (
        <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <AppText variant="bodyStrong" color="text2" style={{ fontSize: size * 0.42 }}>
          {(name?.trim()[0] ?? '?').toUpperCase()}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: colors.primary },
});
