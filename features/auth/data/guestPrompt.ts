import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * 게스트가 1단계를 다 풀었을 때 띄우는 "계정 연결" 안내를 이 기기에서 이미 보여줬는지.
 * 한 번만 띄운다 — 매번 띄우면 이메일 인증을 기다리는 동안 홈에 돌아올 때마다 다시 막힌다.
 * 그 뒤로는 홈 상단의 "게스트" 배지 → 계정 화면에서 언제든 연결할 수 있다.
 */
const KEY = 'daon_guest_stage1_prompted';

export async function hasShownGuestPrompt(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === 'true';
}

export async function markGuestPromptShown(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
