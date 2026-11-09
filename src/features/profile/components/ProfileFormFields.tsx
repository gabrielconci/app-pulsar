import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { formatCpf } from '@/utils/cpf';
import { formatDateInput } from '@/utils/date';
import { TextField } from '@/components/ui';
import type { ProfileForm } from '../schemas';

type Props = {
  control: Control<ProfileForm>;
  errors: FieldErrors<ProfileForm>;
  // create = "Criar perfil" (with CPF); edit = "Editar perfil" (username
  // and contact email instead of CPF, as in Figma).
  mode: 'create' | 'edit';
};

// Fields shared by "Criar perfil" and "Editar perfil".
export function ProfileFormFields({ control, errors, mode }: Props) {
  return (
    <>
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Nome completo"
            placeholder="Inserir nome"
            autoCapitalize="words"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />
      {mode === 'create' ? (
        <>
          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <TextField
                label="CPF"
                placeholder="000.000.000-00"
                keyboardType="number-pad"
                maxLength={14}
                value={field.value}
                onChangeText={(text) => field.onChange(formatCpf(text))}
                onBlur={field.onBlur}
                error={errors.cpf?.message}
                hint="Só você vê seu CPF. Ele também serve para entrar no app."
              />
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={control}
            name="username"
            render={({ field }) => (
              <TextField
                label="Nome de usuário"
                placeholder="Inserir apelido"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                maxLength={30}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.username?.message}
              />
            )}
          />
        </>
      )}
      <Controller
        control={control}
        name="birthDate"
        render={({ field }) => (
          <TextField
            label="Data de nascimento"
            placeholder="dd/mm/aaaa"
            keyboardType="number-pad"
            maxLength={10}
            value={field.value}
            onChangeText={(text) => field.onChange(formatDateInput(text))}
            onBlur={field.onBlur}
            error={errors.birthDate?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="bio"
        render={({ field }) => (
          <TextField
            label="Sobre mim"
            placeholder="Inserir texto"
            multiline
            maxLength={500}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.bio?.message}
            hint="Faça uma breve descrição das suas habilidades, lugares que atuou, preferências e tudo mais que achar pertinente para se conectar com outras pessoas."
          />
        )}
      />
      {mode === 'edit' ? (
        <Controller
          control={control}
          name="contactEmail"
          render={({ field }) => (
            <TextField
              label="Email para contato (opcional)"
              placeholder="Inserir email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.contactEmail?.message}
              hint="Aparece no seu perfil para quem quiser te contratar."
            />
          )}
        />
      ) : null}
    </>
  );
}
