import type { TextStyle } from 'react-native';

// Bahnschrift static weights (generated from the Windows variable font).
// Keys are the names registered with expo-font in the root layout.
export const fontAssets = {
  'Bahnschrift-Light': require('../../assets/fonts/Bahnschrift-Light.ttf'),
  'Bahnschrift-Regular': require('../../assets/fonts/Bahnschrift-Regular.ttf'),
  'Bahnschrift-SemiBold': require('../../assets/fonts/Bahnschrift-SemiBold.ttf'),
  'Bahnschrift-Bold': require('../../assets/fonts/Bahnschrift-Bold.ttf'),
};

export const fonts = {
  light: 'Bahnschrift-Light',
  regular: 'Bahnschrift-Regular',
  semibold: 'Bahnschrift-SemiBold',
  bold: 'Bahnschrift-Bold',
} as const;

// Sizes follow the Figma frames (430 pt wide).
export const textVariants = {
  // Spaced capitals: "BEM VINDO AO PULSAR!", "VAMOS COMEÇAR!"
  display: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: 5, textTransform: 'uppercase' },
  logo: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: 6 },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  lead: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  input: { fontFamily: fonts.regular, fontSize: 15 },
  button: { fontFamily: fonts.semibold, fontSize: 16 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15 },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 15 },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;
