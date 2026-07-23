/**
  Use these spacings for margins/paddings and other whitespace throughout your app.
 */
export const spacingGap = {
  zero: 0,
  xxs: 1,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
  xxxxxl: 40,
  xxxxxxl: 48,
  xxxxxxxl: 64,
  // Readable aliases for extended scale
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 64
} as const;

export const sizes = {
  qrcode: 180
};

export type Gap = keyof typeof spacingGap;
