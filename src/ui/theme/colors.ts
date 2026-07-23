// Color system: LESS files use CSS custom properties (var(--r-*)) which support
// theme switching. TSX inline styles use this static colors object which does NOT
// respond to theme changes. For theme-aware components, prefer CSS var() in LESS.
// Use colors.* only for static inline styles where theme support is not needed.

const palette = {
  white: '#ffffff',
  white_muted: 'rgba(255, 255, 255, 0.5)',
  black: '#000000',
  black_muted: 'rgba(0, 0, 0, 0.5)',
  black_muted2: 'rgba(0, 0, 0, 0.12)',

  dark: '#1E283C',
  grey: '#495361',
  light: '#A2A4AA',

  black_dark: '#2a2626',

  green_dark: '#379a29',
  green: '#41B530',
  green_light: '#5ec04f',

  yellow_dark: '#d5ac00',
  yellow: 'rgb(253,224,71)',
  yellow_light: '#fcd226',

  red_dark: '#c92b40',
  red: '#ED334B',
  red_light: '#f05266',

  blue_dark: '#1461d1',
  blue: '#1872F6',
  blue_light: '#c6dcfd',

  orange_dark: '#d9691c',
  orange: '#FF7B21',
  orange_light: '#ff8f42',

  gold: '#eac249',

  aqua_dark: '#339999',
  aqua: '#48e3c5',
  aqua_light: '#adfff3'
};

export const colors = Object.assign({}, palette, {
  transparent: 'rgba(0, 0, 0, 0)',

  text: palette.white,

  textDim: palette.white_muted,

  background: '#D8E0EF',

  error: '#e52937',

  danger: palette.red,
  danger_muted: '#CC3333',
  danger_bg: '#2c2323',

  card: '#262222',
  warning: palette.orange,
  primary: palette.yellow,

  bg2: '#2a2a2a',
  bg3: '#434242',
  bg4: '#383535',
  bg5: '#1C1919',
  bg_warm: '#322D1F',

  border: 'rgba(255,255,255,0.1)',

  icon_yellow: '#FFBA33',

  icon_secondary: '#888',
  icon_tertiary: '#AAA'
});

export type ColorTypes = keyof typeof colors;
