import { Text, type TextProps } from 'react-native';
import { colors, textVariants, type ColorName, type TextVariant } from '@/theme';

type Props = TextProps & {
  variant?: TextVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
};

// Every text in the app goes through this component so it always uses
// Bahnschrift and the theme colors.
export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: Props) {
  return (
    <Text
      style={[textVariants[variant], { color: colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
