import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getDefaultThemeId, THEMES, type ThemeColors, type ThemeDefinition, type ThemeMode } from './themes';

const STORAGE_KEY = 'daon_theme_id';

interface ThemeContextValue {
  themeId: string;
  theme: ThemeDefinition;
  colors: ThemeColors;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/*
 * 테마 전역 상태.
 *
 * - 사용자가 테마를 한 번도 직접 고른 적이 없으면 시스템 다크모드를 그대로 따라간다
 *   (기기 설정이 바뀌면 앱도 실시간으로 따라 바뀐다).
 * - 한 번이라도 직접 골랐다면 AsyncStorage에 저장해두고, 이후로는 시스템 모드가
 *   바뀌어도 사용자가 고른 테마를 그대로 유지한다.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme: ThemeMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  // null이면 "아직 직접 고른 적 없음" — 이 경우 시스템 다크모드를 그대로 따라간다.
  const [storedThemeId, setStoredThemeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (cancelled || !saved || !THEMES[saved]) return;
      setStoredThemeId(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeId = (id: string) => {
    if (!THEMES[id]) return;
    setStoredThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(() => {
    const themeId = storedThemeId ?? getDefaultThemeId(systemScheme);
    const theme = THEMES[themeId] ?? THEMES[getDefaultThemeId(systemScheme)];
    return { themeId: theme.id, theme, colors: theme.colors, setThemeId };
  }, [storedThemeId, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme은 ThemeProvider 안에서만 쓸 수 있어요');
  return ctx;
}
