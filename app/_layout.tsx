import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../features/auth/AuthContext';

/*
 * 앱 전체 라우팅 뼈대.
 * app/ 폴더는 "어떤 주소에 어떤 화면"만 배선하고, 실제 화면 구현은
 * features/ 안에 둔다. (제작플랜 3번 폴더 구조)
 *
 * AuthProvider로 감싸서 모든 화면이 로그인 상태를 볼 수 있게 한다.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
          <Stack.Screen name="lesson/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
