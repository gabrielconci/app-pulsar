import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { TextInputInstance } from 'react-native';
import { HeroLayout } from '@/components/layout';
import { AppText, Button, TextField } from '@/components/ui';
import { isUsernameAvailable, signUp } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';
import { pendingSignup } from '@/features/auth/pendingSignup';
import { signUpSchema, type SignUpForm } from '@/features/auth/schemas';

export default function SignUpScreen() {
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const username = values.username.trim().toLowerCase();
    const email = values.email.trim().toLowerCase();
    try {
      if (!(await isUsernameAvailable(username))) {
        setError('username', { message: 'Esse nome de usuário já está em uso.' });
        return;
      }
      await signUp({ username, email, password: values.password });
      pendingSignup.set({ email, password: values.password });
      router.replace({ pathname: '/confira-email', params: { email } });
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <HeroLayout image={require('../../../assets/images/hero-cadastro.jpg')} heroRatio={0.32} onBack={() => router.back()}>
      <AppText variant="display">Vamos começar!</AppText>
      <AppText variant="lead">
        Crie sua conta e acesse portfólios virtuais, entre em contato com outros dançarinos e divulgue seu
        trabalho profissional
      </AppText>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <TextField
            label="Usuário"
            placeholder="Inserir usuário"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username-new"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.username?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            ref={emailRef}
            label="Endereço de email"
            placeholder="Inserir email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
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
            autoComplete="password-new"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            hint="Pelo menos 8 caracteres, com letras e números."
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            ref={confirmRef}
            label="Confirmar senha"
            placeholder="Reinserir senha"
            secureTextEntry
            autoComplete="password-new"
            returnKeyType="go"
            onSubmitEditing={() => onSubmit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      {formError ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </AppText>
      ) : null}

      <Button title="Concluir" onPress={onSubmit} loading={isSubmitting} />
    </HeroLayout>
  );
}
