export const colors = {
  bg: {
    primary: '#0D0D0D',
    secondary: '#141414',
    elevated: '#1C1C1E',
    surface: '#2C2C2E',
    hover: '#3A3A3C',
  },

  border: {
    subtle: '#2C2C2E',
    default: '#3A3A3C',
    strong: '#48484A',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E7',
    tertiary: '#8E8E93',
    placeholder: '#636366',
  },

  accent: {
    primary: '#E5E5E7',
    muted: '#E5E5E71A',
  },

  semantic: {
    success: '#30D158',
    successBg: '#30D15826',
    danger: '#FF453A',
    dangerBg: '#FF453A26',
  },

  overlay: 'rgba(0, 0, 0, 0.65)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const typography = {
  title: {fontSize: 20, fontWeight: '700' as const, letterSpacing: 0.3},
  heading: {fontSize: 17, fontWeight: '600' as const},
  body: {fontSize: 14, fontWeight: '400' as const, lineHeight: 20},
  bodyBold: {fontSize: 14, fontWeight: '600' as const},
  caption: {fontSize: 12, fontWeight: '500' as const},
  code: {fontSize: 12, fontFamily: 'Menlo', lineHeight: 18},
  small: {fontSize: 11, fontWeight: '600' as const},
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const MIN_TAP_TARGET = 44;
