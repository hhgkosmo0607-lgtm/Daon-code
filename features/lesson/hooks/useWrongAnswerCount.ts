import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { fetchWrongAnswerCount } from '../data/wrongAnswerRepository';

/** 홈 화면 상단 배지용 — 지금 오답노트에 몇 문제가 쌓여있는지만 가볍게 가져온다 */
export function useWrongAnswerCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      setCount(await fetchWrongAnswerCount(user.id));
    } catch {
      // 배지는 부가 정보라 실패해도 조용히 0으로 둔다
      setCount(0);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { count, reload: load };
}
