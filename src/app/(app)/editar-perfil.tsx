import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, KeyboardScroll } from '@/components/layout';
import { AppText, Button } from '@/components/ui';
import { isUsernameAvailable } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { postKeys } from '@/features/posts/hooks';
import { avatarUrl, updateProfile, uploadAvatar, type Profile } from '@/features/profile/api';
import { ProfileFormFields } from '@/features/profile/components/ProfileFormFields';
import { ProfilePhotoPicker, type PickedPhoto } from '@/features/profile/components/ProfilePhotoPicker';
import { profileKeys, useMyProfile } from '@/features/profile/hooks';
import { editProfileSchema, type ProfileForm } from '@/features/profile/schemas';
import { errorMessage } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import { isoToBrDate, parseBrDate } from '@/utils/date';

// "Editar perfil" (Figma): photo, name, username, birth date, bio, plus
// the optional contact email shown on the profile.
export default function EditProfileScreen() {
  const { data: profile } = useMyProfile();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader onBack />
      {profile ? <EditProfileForm profile={profile} /> : <ActivityIndicator color={colors.primary} style={styles.loading} />}
    </View>
  );
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: profile.full_name ?? '',
      username: profile.username,
      cpf: '',
      birthDate: isoToBrDate(profile.birth_date),
      bio: profile.bio ?? '',
      contactEmail: profile.contact_email ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (values.username !== profile.username && !(await isUsernameAvailable(values.username))) {
        setError('username', { message: 'Esse nome de usuário já está em uso.' });
        return;
      }
      const avatarPath = photo ? await uploadAvatar(userId, photo.uri, photo.mimeType) : undefined;
      await updateProfile(userId, {
        fullName: values.fullName,
        username: values.username,
        birthDate: parseBrDate(values.birthDate)!,
        bio: values.bio,
        contactEmail: values.contactEmail,
        avatarPath,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me(userId) }),
        queryClient.invalidateQueries({ queryKey: profileKeys.public(userId) }),
        // Posts show the author's name and photo.
        queryClient.invalidateQueries({ queryKey: postKeys.all }),
      ]);
      router.back();
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        setError('username', { message: 'Esse nome de usuário já está em uso.' });
      } else {
        setFormError(errorMessage(error));
      }
    }
  });

  return (
    <KeyboardScroll contentStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
      <AppText variant="title">Editar perfil</AppText>
      <ProfilePhotoPicker uri={photo?.uri ?? avatarUrl(profile.avatar_path)} onPick={setPhoto} />
      <ProfileFormFields control={control} errors={errors} mode="edit" />
      {formError ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </AppText>
      ) : null}
      <Button title="Salvar" onPress={onSubmit} loading={isSubmitting} style={styles.button} />
    </KeyboardScroll>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { marginTop: spacing.xxl },
  content: { paddingHorizontal: spacing.form, paddingTop: spacing.lg, gap: spacing.xl },
  button: { marginTop: spacing.sm },
});
