export const Colors = {
  primary: '#003087',
  primaryLight: '#1A4FAF',
  primaryDark: '#001F5C',
  accent: '#E8B800',
  accentLight: '#FFD740',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  routeLine: '#1A4FAF',
  avatarColor: '#E8B800',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.15)',
} as const;

export type ColorKey = keyof typeof Colors;