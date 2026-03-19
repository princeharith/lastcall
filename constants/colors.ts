export const Colors = {
  primary: '#FF6B2B',       // Orange – brand color
  primaryLight: '#FF8F5E',
  primaryDark: '#E05520',

  warning: '#F5A623',       // Amber
  critical: '#E8453C',      // Red
  success: '#4CAF50',       // Green

  background: '#0F0F0F',    // Near-black
  surface: '#1C1C1E',       // Card background
  surfaceElevated: '#2C2C2E',

  text: '#FFFFFF',
  textSecondary: '#ABABAB',
  textMuted: '#636366',

  border: '#3A3A3C',
  separator: '#2C2C2E',

  gaugeBackground: '#2C2C2E',
  gaugeGood: '#4CAF50',
  gaugeWarning: '#F5A623',
  gaugeCritical: '#E8453C',

  tabBarBackground: '#1C1C1E',
  tabBarActive: '#FF6B2B',
  tabBarInactive: '#636366',
} as const;

export type ColorKey = keyof typeof Colors;
