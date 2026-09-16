import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../features/auth/AuthContext';
import { useApplyPendingOnboarding } from '../features/onboarding/hooks/useApplyPendingOnboarding';
import { ThemeProvider, useTheme } from '../shared/theme/ThemeContext';

/*
 * 앱 전체 라우팅 뼈대.
 * app/ 폴더는 "어떤 주소에 어떤 화면"만 배선하고, 실제 화면 구현은
 * features/ 안에 둔다. (제작플랜 3번 폴더 구조)
 *
 * AuthProvider로 감싸서 모든 화면이 로그인 상태를 볼 수 있게 한다.
 * ThemeProvider는 가장 바깥에 둬서 StatusBar·화면 배경까지 테마를 따라가게 한다.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppBootstrap />
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * 화면을 그리지 않고 앱 시작 시 한 번 해야 하는 일만 처리한다.
 * useAuth()를 써야 해서 AuthProvider 안(자식)에 있어야 한다.
 */
function AppBootstrap() {
  useApplyPendingOnboarding();
  return null;
}

/** 현재 테마에 맞춰 상태 표시줄 아이콘 색과 화면 기본 배경을 맞춘다. */
function AppShell() {
  const { theme, colors } = useTheme();

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="lesson/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/theme" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
