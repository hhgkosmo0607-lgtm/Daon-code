import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../features/auth/AuthContext';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { HomeScreen } from '../features/lesson/screens/HomeScreen';
import { hasOnboarded } from '../features/onboarding/data/pendingSync';
import { useTheme } from '../shared/theme/ThemeContext';

/*
 * 앱의 첫 화면. 온보딩을 아직 안 봤으면 홈 대신 온보딩으로 보낸다.
 * (기획서 6번 — 온보딩은 앱을 처음 여는 모든 사람이 거쳐야 하는 관문)
 *
 * 온보딩은 봤는데 세션이 없으면(로그인 화면에서 앱을 껐거나, 로그아웃·계정 삭제 직후)
 * 홈 대신 로그인 화면을 보여준다. 세션 없는 홈은 레슨 제출이 전부 실패한다.
 */
export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasOnboarded().then((seen) => {
      if (cancelled) return;
      if (!seen) {
        router.replace('/onboarding');
      } else {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return session ? <HomeScreen /> : <AuthScreen />;
}
