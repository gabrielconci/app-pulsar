// Light theme approved on 2026-11-08. The accent is the orange of the
// "Entrar" button in Figma; every action button uses it.
export const colors = {
  bg: '#FFFFFF',
  surface: '#F5F4F2',
  surface2: '#EBE9E6',
  text: '#1A1918',
  text2: '#5E5B58',
  text3: '#8F8B87',
  line: '#CFCCC8',
  primary: '#D97C2B',
  primaryPressed: '#BC6620',
  primarySoft: '#FBEBDD',
  onPrimary: '#FFFFFF',
  danger: '#C2412D',
  white: '#FFFFFF',
  black: '#000000',
  // Dark translucent fill behind text on photos (post title pill).
  scrim: 'rgba(20, 18, 16, 0.55)',
} as const;

export type ColorName = keyof typeof colors;
