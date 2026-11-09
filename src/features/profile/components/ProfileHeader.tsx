import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { ageFromIso } from '@/utils/date';
import { avatarUrl, type PublicProfile } from '../api';

// Top of the profile (Figma): portrait photo with orange border; name and
// age, a line, the bio and the contact email.
export function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const name = profile.full_name ?? profile.username;
  const age = profile.birth_date ? ageFromIso(profile.birth_date) : null;
  const photo = avatarUrl(profile.avatar_path);

  return (
    <View style={styles.row}>
      <View style={styles.photo}>
        {photo ? (
          <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
        ) : (
          <AppText variant="title" color="text3">
            {name.trim()[0]?.toUpperCase()}
          </AppText>
        )}
      </View>
      <View style={styles.info}>
        <AppText variant="title" style={styles.name} accessibilityRole="header">
          {age !== null ? `${name}, ${age}` : name}
        </AppText>
        <View style={styles.line} />
        {profile.bio ? (
          <AppText variant="body" color="text2">
            {profile.bio}
          </AppText>
        ) : null}
        {profile.contact_email ? (
          <AppText variant="bodyStrong" selectable style={styles.email}>
            {profile.contact_email}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.xl },
  photo: {
    width: 148,
    height: 205,
    borderRadius: radius.md + 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, paddingTop: spacing.lg, gap: spacing.sm },
  name: { fontSize: 20, lineHeight: 26 },
  line: { height: 1.5, backgroundColor: colors.line, marginBottom: spacing.xs },
  email: { marginTop: spacing.md, fontSize: 14 },
});
