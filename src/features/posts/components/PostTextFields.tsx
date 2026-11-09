import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { View, StyleSheet } from 'react-native';
import { TextField } from '@/components/ui';
import { spacing } from '@/theme';

export type PostTextForm = { title: string; subtitle: string; body: string; caption: string };

type Props = {
  control: Control<PostTextForm>;
  errors: FieldErrors<PostTextForm>;
  // Projects have title, subtitle and text; other posts only the caption.
  isProject: boolean;
};

// Text fields of a post, as in the Figma "Novo projeto" section.
export function PostTextFields({ control, errors, isProject }: Props) {
  return (
    <View style={styles.fields}>
      {isProject ? (
        <>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <TextField
                boxed
                label="Título"
                placeholder="Adicionar..."
                maxLength={100}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.title?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="subtitle"
            render={({ field }) => (
              <TextField
                boxed
                label="Subtítulo"
                placeholder="Adicionar..."
                maxLength={200}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.subtitle?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <TextField
                boxed
                multiline
                label="Texto"
                placeholder="Conte a história do seu projeto"
                maxLength={10000}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.body?.message}
                style={styles.body}
              />
            )}
          />
        </>
      ) : null}
      <Controller
        control={control}
        name="caption"
        render={({ field }) => (
          <TextField
            boxed
            multiline
            label="Legenda"
            placeholder="Escreva uma legenda (opcional)"
            hint="Aparece na Descrição da publicação."
            maxLength={2200}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.caption?.message}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.xl },
  body: { minHeight: 160 },
});
