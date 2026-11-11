export const colors = {
  // Primary Brand Vibrant Cyan/Teal (#1fb6c6)
  primary: '#1FB6C6',
  primaryDark: '#1699A7',
  primaryLight: '#E8F9FB',
  primaryCyan: '#1FB6C6',

  // Secondary Brand Action Orange (#ea580c)
  secondary: '#EA580C',
  secondaryDark: '#C2410C',
  secondaryLight: '#FFF1EA',
  featuredOrange: '#EA580C',
  featuredBg: '#FFF1EA',

  // Neutrals & Surfaces
  peachBg: '#FFF6F3',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  profileHeader: '#F8FBFB',

  // Status & Validation
  verifiedGreen: '#8AC443',
  verifiedGreenDark: '#72A437',
  warning: '#F59E0B',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',

  // Text & Borders
  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  textPlaceholder: '#A1A1AA',
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  divider: '#E4E4E7',

  // Gradients
  gradientStart: '#EDF8F7',
  gradientMid: '#F3FAF8',
  gradientEnd: '#FBF2ED',
} as const;

export type ColorTokens = typeof colors;
