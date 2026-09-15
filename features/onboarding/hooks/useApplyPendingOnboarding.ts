import { useEffect, useRef } from 'react';
import { completePlacement } from '../../../shared/lib/edgeFunctions';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import { clearPendingOnboarding, loadPendingOnboarding } from '../data/pendingSync';

/*
 * 온보딩에서 로그인 전에 모아둔 하루목표·알림시간·배치고사 답안을,
 * 로그인(또는 "나중에 하기"로 게스트 세션이 생기는) 직후에 실제로 반영한다.
 *
 * daily_goal/notify_time은 profiles의 설정성 컬럼이라 클라이언트가 직접 UPDATE해도
 * RLS가 허용한다 (xp/streak 컬럼과 달리 트리거로 막혀있지 않음).
 * 배치고사 답안은 서버가 다시 채점해야 하므로 Edge Function을 거친다.
 */
export function useApplyPendingOnboarding() {
  const { user } = useAuth();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!user || appliedRef.current) return;
    appliedRef.current = true;

    (async () => {
      const pending = await loadPendingOnboarding();
      if (!pending) return;

      try {
        if (pending.dailyGoal !== undefined || pending.notifyTime !== undefined) {
          await supabase
            .from('profiles')
            .update({
              ...(pending.dailyGoal !== undefined ? { daily_goal: pending.dailyGoal } : {}),
              ...(pending.notifyTime !== undefined ? { notify_time: pending.notifyTime } : {}),
            })
            .eq('id', user.id);
        }

        if (pending.placementAnswers) {
          await completePlacement(pending.placementAnswers);
        }

        await clearPendingOnboarding();
      } catch (e) {
        // 실패하면 지우지 않는다 — 다음에 앱을 다시 열 때 재시도된다.
        console.warn('[onboarding] 대기 중이던 온보딩 정보 반영 실패, 다음 실행 때 재시도', e);
        appliedRef.current = false;
      }
    })();
  }, [user]);
}
