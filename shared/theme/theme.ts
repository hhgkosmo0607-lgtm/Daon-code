/*
 * 앱 전체에서 재사용하는 색상/여백 값.
 * 컴포넌트마다 색상을 직접 하드코딩하지 않고 여기서 가져다 쓴다.
 * (제작플랜 5번: shared/theme)
 */
export const colors = {
  primary: '#2C3E50',
  accent: '#FF6B35',
  success: '#2ECC71',
  error: '#E74C3C',
  background: '#F7F7F9',
  card: '#FFFFFF',
  border: '#E0E0E0',
  text: '#222222',
  textMuted: '#8A8A8A',
  streak: '#FF9500',
  xp: '#FFC107',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
} as const;
