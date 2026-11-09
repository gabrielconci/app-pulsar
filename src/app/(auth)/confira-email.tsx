import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { HeroLayout } from '@/components/layout';
import { AppText, Button, Icon, TextField } from '@/components/ui';
import { changeSignupEmail, loginWithIdentifier, resendConfirmation } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';
import { pendingSignup } from '@/features/auth/pendingSignup';
import { emailSchema } from '@/features/auth/schemas';
import { colors, fonts, radius, spacing } from '@/theme';

const RESEND_SECONDS = 60;

// Shown after "Concluir" on Cadastro. Not in Figma; follows the Cadastro style.
export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState<'login' | 'resend' | 'change' | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'danger' | 'text2' } | null>(null);
  const [changing, setChanging] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailError, setNewEmailError] = useState<string>();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const goToLogin = () => {
    pendingSignup.clear();
    router.replace('/login');
  };

  const onConfirmed = async () => {
    const pending = pendingSignup.get();
    // App was restarted: we no longer have the password, so ask for it on Login.
    if (!pending) return goToLogin();

    setBusy('login');
    setMessage(null);
    try {
      await loginWithIdentifier(pending.email, pending.password);
      pendingSignup.clear();
    } catch (error) {
      setMessage({ text: errorMessage(error), tone: 'danger' });
    } finally {
      setBusy(null);
    }
  };

  const onResend = async () => {
    setBusy('resend');
    setMessage(null);
    try {
      await resendConfirmation(email);
      setCooldown(RESEND_SECONDS);
      setMessage({ text: 'Enviamos um novo link.', tone: 'text2' });
    } catch (error) {
      setMessage({ text: errorMessage(error), tone: 'danger' });
    } finally {
      setBusy(null);
    }
  };

  const onChangeEmail = async () => {
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) return setNewEmailError('Email inválido.');
    const pending = pendingSignup.get();
    if (!pending) return goToLogin();

    setBusy('change');
    setNewEmailError(undefined);
    setMessage(null);
    try {
      await changeSignupEmail({ email: pending.email, password: pending.password, newEmail: parsed.data });
      pendingSignup.set({ email: parsed.data, password: pending.password });
      setEmail(parsed.data);
      setChanging(false);
      setNewEmail('');
      setCooldown(RESEND_SECONDS);
      setMessage({ text: 'Pronto! Enviamos o link para o novo email.', tone: 'text2' });
    } catch (error) {
      setNewEmailError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <HeroLayout image={require('../../../assets/images/hero-cadastro.jpg')} heroRatio={0.32} onBack={goToLogin}>
      <View style={styles.mail}>
        <Icon name="mail" size={32} color={colors.primary} />
      </View>
      <AppText variant="display" align="center">
        Confira seu email
      </AppText>
      <AppText variant="lead" align="center">
        Enviamos um link de confirmação para <AppText variant="lead" style={styles.strong}>{email}</AppText>.
      </AppText>

      <View style={styles.steps}>
        {[
          'Abra o email do Pulsar. Se não achar, olhe a caixa de spam.',
          'Toque em "Confirmar email".',
          'Volte aqui e entre na sua conta.',
        ].map((text, i) => (
          <View key={text} style={styles.step}>
            <View style={styles.stepNumber}>
              <AppText variant="captionStrong" color="primary">
                {i + 1}
              </AppText>
            </View>
            <AppText variant="body" color="text2" style={styles.stepText}>
              {text}
            </AppText>
          </View>
        ))}
      </View>

      {message ? (
        <AppText variant="caption" color={message.tone} align="center" accessibilityLiveRegion="polite">
          {message.text}
        </AppText>
      ) : null}

      <Button title="Já confirmei, entrar" onPress={onConfirmed} loading={busy === 'login'} />

      <View style={styles.row}>
        <AppText variant="body" color="text2">
          Não recebeu?{' '}
        </AppText>
        {cooldown > 0 ? (
          <AppText variant="bodyStrong" color="text3">
            Reenviar em 0:{String(cooldown).padStart(2, '0')}
          </AppText>
        ) : (
          <Pressable accessibilityRole="button" onPress={onResend} disabled={busy !== null} hitSlop={8}>
            <AppText variant="bodyStrong" color="primary">
              {busy === 'resend' ? 'Reenviando…' : 'Reenviar email'}
            </AppText>
          </Pressable>
        )}
      </View>

      {changing ? (
        <View style={styles.change}>
          <TextField
            label="Novo email"
            placeholder="Inserir email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            value={newEmail}
            onChangeText={setNewEmail}
            onSubmitEditing={onChangeEmail}
            error={newEmailError}
          />
          <View style={styles.changeButtons}>
            <Button title="Cancelar" variant="secondary" style={styles.flex} onPress={() => setChanging(false)} />
            <Button title="Enviar" style={styles.flex} onPress={onChangeEmail} loading={busy === 'change'} />
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setChanging(true)} hitSlop={8} style={styles.center}>
          <AppText variant="body" color="text2" style={styles.underline}>
            Usar outro email
          </AppText>
        </Pressable>
      )}
    </HeroLayout>
  );
}

const styles = StyleSheet.create({
  mail: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  strong: { fontFamily: fonts.semibold },
  steps: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  center: { alignSelf: 'center' },
  underline: { textDecorationLine: 'underline' },
  change: { gap: spacing.md },
  changeButtons: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
