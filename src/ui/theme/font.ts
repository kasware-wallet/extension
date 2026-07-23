/**
 * Typography scale - matches CSS variables --r-font-*
 * Use these constants for inline styles; prefer CSS variables in stylesheets
 */
export const fontSizes = {
  xxxs: 8,
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  /**
   * @deprecated Use fontSizes.xxxl instead
   */
  logo: 32,

  /**
   * @deprecated Use fontSizes.sm instead
   */
  icon: 14,

  /**
   * @deprecated Use fontSizes.xl instead
   */
  iconMiddle: 20,

  /**
   * @deprecated Use fontSizes.xxxl instead
   */
  iconLarge: 32,

  /**
   * @deprecated Use fontSizes.xxl or fontSizes.xxxl instead
   */
  banner: 30,

  /**
   * @deprecated Use fontSizes.xxl instead
   */
  title: 26,

  /**
   * @deprecated Use fontSizes.sm instead
   */
  tiny: 14,

  /**
   * @deprecated Use fontSizes.xs instead
   */
  tinyShort: 12
};
