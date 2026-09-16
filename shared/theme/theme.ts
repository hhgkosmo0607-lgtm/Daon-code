/*
 * 앱 전체에서 재사용하는 여백/모서리 값.
 * 색상은 여기 없다 — 테마별로 값이 달라지므로 `shared/theme/themes.ts` +
 * `useTheme()`(ThemeContext.tsx)에서 가져다 쓴다.
 * (제작플랜 5번: shared/theme)
 */
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
