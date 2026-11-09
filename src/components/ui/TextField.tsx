import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { colors, spacing, textVariants } from '@/theme';
import { AppText } from './AppText';

type Props = Omit<TextInputProps, 'ref'> & {
  ref?: Ref<TextInputInstance>;
  label: string;
  error?: string;
  // Helper text under the field (e.g. "Sobre mim" description).
  hint?: string;
};

// Label + input with a line underneath, as in the Figma forms.
export function TextField({ ref, label, error, hint, style, onFocus, onBlur, multiline, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const lineColor = error ? colors.danger : focused ? colors.primary : colors.line;

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.text3}
        cursorColor={colors.primary}
        selectionColor={colors.primarySoft}
        multiline={multiline}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          { borderBottomColor: lineColor, borderBottomWidth: focused || error ? 1.5 : 1 },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="text3">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  input: {
    ...textVariants.input,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
});
