import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * 온보딩 위저드는 로그인/게스트 세션이 생기기 전 단계(하루목표, 알림시간,
 * 배치고사)에서 답을 모은다. 하지만 그 답을 실제로 저장하려면 user_id가
 * 필요해서, 세션이 생기기 전까지는 기기에 잠깐 담아둔다.
 *
 * "온보딩을 봤는지" 여부도 여기서 같이 관리한다 — 아직 서버에 컬럼을 두지 않았고
 * (기획서 DB 스키마에 없음), 기기 단위로만 판단해도 충분한 정보라서 로컬에 둔다.
 */
const PENDING_KEY = 'daon_pending_onboarding';
const ONBOARDED_KEY = 'daon_onboarded';

export interface PendingOnboarding {
  dailyGoal?: number;
  notifyTime?: string;
  placementAnswers?: Record<string, number | number[]>;
}

export async function savePendingOnboarding(data: PendingOnboarding): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export async function loadPendingOnboarding(): Promise<PendingOnboarding | null> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOnboarding;
  } catch {
    return null;
  }
}

export async function clearPendingOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_KEY);
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

export async function hasOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
}
