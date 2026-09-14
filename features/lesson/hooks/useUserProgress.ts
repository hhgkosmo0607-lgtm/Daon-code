import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setStatusMap({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [p, rows] = await Promise.all([fetchProfile(user.id), fetchProgress(user.id)]);
      setProfile(p);
      setStatusMap(toStatusMap(rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했어요');
    } finally {
      setLoading(false);
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

  return { profile, statusMap, loading, error, reload: load };
}
