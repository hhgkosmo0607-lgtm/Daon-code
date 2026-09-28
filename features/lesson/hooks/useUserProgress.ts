import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import {
  fetchProfile,
  fetchProgress,
  toStatusMap,
  type Profile,
} from '../data/userRepository';
import type { LessonStatus } from '../domain/types';

/*
 * 홈 화면에 필요한 유저 데이터(프로필 + 레슨별 상태)를 가져온다.
 *
 * 로그인 전(세션 없음)에는 아무것도 조회하지 않고 빈 상태를 돌려준다.
 * 그래야 Supabase 설정 전에도 앱이 죽지 않고 화면 확인이 가능하다.
 */
export function useUserProgress() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, LessonStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 마운트·앱 복귀·다시 시도가 겹쳐서 여러 번 불러올 수 있으므로, 마지막 요청의 결과만 반영한다
  const requestSeq = useRef(0);
  const loadedUserId = useRef<string | null>(null);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;

    if (!user) {
      loadedUserId.current = null;
      setProfile(null);
      setStatusMap({});
      return;
    }

    // 다른 계정으로 바뀌었으면 이전 계정의 기록을 먼저 지운다 (불러오기 실패 시 남아 보이지 않게)
    if (loadedUserId.current !== user.id) {
      loadedUserId.current = user.id;
      setProfile(null);
      setStatusMap({});
    }

    setLoading(true);
    setError(null);

    try {
      const [p, rows] = await Promise.all([fetchProfile(user.id), fetchProgress(user.id)]);
      if (seq !== requestSeq.current) return;
      setProfile(p);
      setStatusMap(toStatusMap(rows));
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했어요');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // 이펙트 본문에서 동기적으로 setState하지 않도록 마이크로태스크 뒤로 넘긴다.
    // (동기 setState는 연쇄 렌더링을 유발한다)
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // 앱을 다시 열면(백그라운드 → 앞) 새로 불러온다. 자정을 넘긴 뒤 스트릭 표시나
  // 다른 기기에서 쌓은 진도가 예전 값으로 남아 있지 않게 한다.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  return { profile, statusMap, loading, error, reload: load };
}
