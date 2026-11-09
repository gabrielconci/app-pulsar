import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View, type TextInputInstance } from 'react-native';
import { HeroLayout } from '@/components/layout';
import { AppText, Button, TextField } from '@/components/ui';
import { loginWithIdentifier } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';
import { loginSchema, type LoginForm } from '@/features/auth/schemas';
import { spacing } from '@/theme';

export default function LoginScreen() {
  const passwordRef = useRef<TextInputInstance>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });

  const onSubmit = handleSubmit(async ({ identifier, password }) => {
    setFormError(null);
    try {
      // On success the root layout switches to the logged-in screens.
      await loginWithIdentifier(identifier, password);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <HeroLayout
      image={require('../../../assets/images/hero-login.jpg')}
      above={
        <AppText variant="display" color="primary" align="center">
          Bem vindo ao Pulsar!
        </AppText>
      }
    >
      <AppText variant="lead">Faça log-in ou crie uma conta para começar a construir o seu portfólio</AppText>

      <Controller
        control={control}
        name="identifier"
        render={({ field }) => (
          <TextField
            label="Usuário, email ou CPF"
            placeholder="Inserir usuário, email ou CPF"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.identifier?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            ref={passwordRef}
            label="Senha"
            placeholder="Inserir senha"
            secureTextEntry
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={() => onSubmit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />

      {formError ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </AppText>
      ) : null}

      <Button title="Entrar" onPress={onSubmit} loading={isSubmitting} />

      <View style={styles.signup}>
        <AppText variant="body">Não possui uma conta? </AppText>
        <Link href="/cadastro" asChild>
          <AppText variant="bodyStrong" accessibilityRole="link" suppressHighlighting>
            Cadastre-se aqui
          </AppText>
        </Link>
      </View>
    </HeroLayout>
  );
}

const styles = StyleSheet.create({
  signup: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingTop: spacing.xs },
});
