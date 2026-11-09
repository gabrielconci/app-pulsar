import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, KeyboardScroll } from '@/components/layout';
import { AppText, Button } from '@/components/ui';
import { signOut } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/lib/errors';
import { avatarUrl, isCpfAvailable, saveProfile, uploadAvatar } from '@/features/profile/api';
import { ProfileFormFields } from '@/features/profile/components/ProfileFormFields';
import { ProfilePhotoPicker, type PickedPhoto } from '@/features/profile/components/ProfilePhotoPicker';
import { profileKeys, useMyProfile } from '@/features/profile/hooks';
import { profileFormSchema, type ProfileForm } from '@/features/profile/schemas';
import { spacing } from '@/theme';
import { formatCpf, onlyDigits } from '@/utils/cpf';
import { isoToBrDate, parseBrDate } from '@/utils/date';

export default function CreateProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session!.user.id;
  const { data: profile } = useMyProfile();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      cpf: profile?.cpf ? formatCpf(profile.cpf) : '',
      birthDate: isoToBrDate(profile?.birth_date),
      bio: profile?.bio ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const cpf = onlyDigits(values.cpf);
    try {
      if (!(await isCpfAvailable(cpf))) {
        setError('cpf', { message: 'Esse CPF já está cadastrado em outra conta.' });
        return;
      }
      const avatarPath = photo ? await uploadAvatar(userId, photo.uri, photo.mimeType) : undefined;
      await saveProfile(userId, {
        fullName: values.fullName,
        cpf,
        birthDate: parseBrDate(values.birthDate)!,
        bio: values.bio,
        avatarPath,
      });
      await queryClient.invalidateQueries({ queryKey: profileKeys.me(userId) });
      router.push('/interesses');
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {/* Leaving sign-up before finishing the profile logs out. */}
      <AppHeader onBack={signOut} />
      <KeyboardScroll contentStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <AppText variant="title">Criar perfil</AppText>
        <ProfilePhotoPicker uri={photo?.uri ?? avatarUrl(profile?.avatar_path)} onPick={setPhoto} />
        <ProfileFormFields control={control} errors={errors} />
        {formError ? (
          <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}
        <Button title="Salvar" onPress={onSubmit} loading={isSubmitting} style={styles.button} />
      </KeyboardScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.form, paddingTop: spacing.lg, gap: spacing.xl },
  button: { marginTop: spacing.sm },
});
