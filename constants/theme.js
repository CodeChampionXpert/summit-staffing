/**
 * Summit Staffing – shared theme for consistent UI/UX
 * Used by components and screens for colors, spacing, typography, radius.
 * Light and dark themes so web and mobile look the same.
 */

export const ColorsLight = {
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  primaryLight: '#22D3EE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
    white: '#FFFFFF',
    inverse: '#FFFFFF',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4',
  },
};

export const ColorsDark = {
  primary: '#22D3EE',
  primaryDark: '#06B6D4',
  primaryLight: '#67E8F9',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  borderLight: '#334155',
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
    white: '#FFFFFF',
    inverse: '#0F172A',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#22D3EE',
  },
};

/** @deprecated Use useTheme() or ColorsLight/ColorsDark – kept for backward compat */
export const Colors = ColorsLight;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  fontSize: {
    xs: 13,
    sm: 15,
    base: 17,
    lg: 19,
    xl: 22,
    xxl: 26,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
};

export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
};

export const Theme = {
  Colors,
  Spacing,
  Typography,
  Radius,
  Shadows,
};

export default Theme;
