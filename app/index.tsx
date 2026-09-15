import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HomeScreen } from '../features/lesson/screens/HomeScreen';
import { hasOnboarded } from '../features/onboarding/data/pendingSync';
import { colors } from '../shared/theme/theme';

/*
 * 앱의 첫 화면. 온보딩을 아직 안 봤으면 홈 대신 온보딩으로 보낸다.
 * (기획서 6번 — 온보딩은 앱을 처음 여는 모든 사람이 거쳐야 하는 관문)
 */
export default function Index() {
  const router = useRouter();
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

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <HomeScreen />;
}
