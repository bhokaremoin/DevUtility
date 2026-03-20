/**
 * @file theme/index.ts
 * @description Design-system tokens for DevUtility's dark macOS UI.
 *
 * Architecture Role: Single source of truth for colors, spacing, typography,
 * and border-radius values. All components import from here so visual changes
 * propagate globally without hunting through individual stylesheets.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
// Background surfaces use pure neutral grays — no color cast. Each level
// steps ~8 points lighter to create clear, legible elevation without shadows.
// Borders are alpha-white so they adapt to any surface automatically.
// Accent: Dracula-theme Cyan — distinctive, avoids generic Apple Blue, and
// reads cleanly against neutral dark surfaces (VS Code Dracula palette).
// ---------------------------------------------------------------------------
export const colors = {
  bg: {
    primary:   '#0C0C0C',   // near-black — no hue cast
    secondary: '#141414',   // +8
    elevated:  '#1C1C1C',   // panels, cards — matches macOS window bg
    surface:   '#252525',   // inputs, code editors
    hover:     '#2F2F2F',   // hover / pressed state
  },

  border: {
    subtle:    '#FFFFFF0A',  //  4% white — hairline dividers
    default:   '#FFFFFF16',  //  9% white — default strokes
    strong:    '#FFFFFF28',  // 16% white — emphasized edges
    highlight: '#FFFFFF3C',  // 24% white — modal card edges
  },

  text: {
    primary:     '#FFFFFF',
    secondary:   '#E8E8E8',
    tertiary:    '#9A9A9A',
    placeholder: '#5C5C5C',
  },

  // Dracula-theme Cyan accent — the iconic #8BE9FD used across VS Code's
  // most popular dark theme. primary/muted/border use the bright cyan for
  // labels and tints; deep uses Cyan-600 (#0891B2) as the solid CTA fill
  // so white button text hits the 4.5:1 contrast minimum.
  accent: {
    primary: '#8BE9FD',    // Dracula Cyan — labels, icons, selected text
    deep:    '#0891B2',    // Cyan-600 — solid CTA button background
    muted:   '#8BE9FD12', // 7% — row selection background
    border:  '#8BE9FD44', // 27% — selection / focus border
  },

  semantic: {
    success:   '#34D399',   // Tailwind Emerald-400
    successBg: '#34D39918', // 9%
    danger:    '#F87171',   // Tailwind Red-400
    dangerBg:  '#F8717118', // 9%
  },

  overlay: 'rgba(0, 0, 0, 0.78)',
} as const;

// ---------------------------------------------------------------------------
// Spacing — 8-pt grid with named steps
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Typography — predefined text styles
// ---------------------------------------------------------------------------
export const typography = {
  title:   {fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.2},
  heading: {fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.1},
  body:    {fontSize: 14, fontWeight: '400' as const, lineHeight: 21},
  bodyBold: {fontSize: 14, fontWeight: '600' as const},
  caption: {fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.1},
  code:    {fontSize: 12, fontFamily: 'Menlo', lineHeight: 19},
  small:   {fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2},
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Border radii
// ---------------------------------------------------------------------------
export const radii = {
  sm:   6,
  md:   10,
  lg:   16,
  pill: 999,
} as const;

/** Header height — macOS toolbar standard. */
export const HEADER_HEIGHT = 52;

/** Minimum touch target dimension (44 pt) per Apple HIG. */
export const MIN_TAP_TARGET = 44;
