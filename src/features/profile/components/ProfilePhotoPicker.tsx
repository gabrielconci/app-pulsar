import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { colors, radius } from '@/theme';

export type PickedPhoto = { uri: string; mimeType: string };

type Props = {
  // Local photo just picked, or the saved photo URL.
  uri: string | null;
  onPick: (photo: PickedPhoto) => void;
};

// Portrait photo with orange border and a camera button (Criar/Editar perfil).
export function ProfilePhotoPicker({ uri, onPick }: Props) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    onPick({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Trocar foto de perfil' : 'Escolher foto de perfil'}
      onPress={pick}
      style={styles.wrapper}
    >
      <View style={styles.frame}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <AppText variant="caption" color="text3" align="center">
            Toque para{'\n'}escolher uma foto
          </AppText>
        )}
      </View>
      <View style={styles.camera}>
        <Icon name="camera" size={22} color={colors.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', paddingBottom: 20 },
  frame: {
    width: 214,
    height: 296,
    borderRadius: radius.md + 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
