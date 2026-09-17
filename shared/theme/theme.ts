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

/*
 * 커맨드 창 느낌을 내려고 전부 직각(0)으로 통일했다.
 * sm/md/lg/full 구분은 유지해서, 나중에 다시 둥글게 하고 싶으면 여기 숫자만 바꾸면 된다.
 */
export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  full: 0,
} as const;
