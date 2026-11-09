import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HeroLayout } from '@/components/layout';
import { AppText, Button, Chip } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/lib/errors';
import { MAX_INTERESTS, setMyInterests } from '@/features/interests/api';
import { interestKeys, useInterests, useProfileInterestIds } from '@/features/interests/hooks';
import { completeOnboarding } from '@/features/profile/api';
import { profileKeys } from '@/features/profile/hooks';
import { colors, spacing } from '@/theme';

export default function InterestsScreen() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session!.user.id;
  const interests = useInterests();
  const saved = useProfileInterestIds(userId);
  const [picked, setPicked] = useState<number[] | null>(null);
  const [busy, setBusy] = useState<'skip' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start from what's saved (if the user comes back to this screen).
  const selected = picked ?? saved.data ?? [];
  const full = selected.length >= MAX_INTERESTS;

  const toggle = (id: number) =>
    setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const finish = async (mode: 'skip' | 'save') => {
    setBusy(mode);
    setError(null);
    try {
      if (mode === 'save') {
        await setMyInterests(selected);
        queryClient.invalidateQueries({ queryKey: interestKeys.ofProfile(userId) });
      }
      await completeOnboarding(userId);
      // The root layout sees the finished onboarding and opens the app.
      await queryClient.invalidateQueries({ queryKey: profileKeys.me(userId) });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  };

  return (
    <HeroLayout
      image={require('../../../assets/images/hero-interesses.jpg')}
      heroRatio={0.34}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/criar-perfil'))}
      card={false}
    >
      <View style={styles.intro}>
        <AppText variant="display" align="center">
          Experiência completa!
        </AppText>
        <AppText variant="body" color="text2" align="center">
          Selecione até {MAX_INTERESTS} interesses que mais te chamam a atenção. Eles aparecem no seu perfil.
        </AppText>
      </View>

      {interests.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <View style={styles.chips}>
          {interests.data?.map((interest) => {
            const isOn = selected.includes(interest.id);
            return (
              <Chip
                key={interest.id}
                label={interest.name}
                selected={isOn}
                disabled={full && !isOn}
                onPress={() => toggle(interest.id)}
              />
            );
          })}
        </View>
      )}

      <AppText variant="body" color="text2" align="center" accessibilityLiveRegion="polite">
        <AppText variant="bodyStrong" color="primary">
          {selected.length}
        </AppText>{' '}
        de {MAX_INTERESTS} selecionados
      </AppText>

      {error ? (
        <AppText variant="caption" color="danger" align="center">
          {error}
        </AppText>
      ) : null}

      <View style={styles.buttons}>
        <Button
          title="Pular"
          variant="secondary"
          style={styles.flex}
          onPress={() => finish('skip')}
          loading={busy === 'skip'}
          disabled={busy === 'save'}
        />
        <Button
          title="Continuar"
          style={styles.flex}
          onPress={() => finish('save')}
          loading={busy === 'save'}
          disabled={selected.length === 0 || busy === 'skip'}
        />
      </View>
    </HeroLayout>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  loading: { paddingVertical: spacing.xxl },
  buttons: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm },
  flex: { flex: 1 },
});
