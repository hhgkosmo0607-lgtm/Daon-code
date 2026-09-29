import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { calculateCoins, calculateXp, isCorrect } from '../../../features/lesson/domain/scoring.ts';
import { toKstDateString, updateStreak } from '../../../features/lesson/domain/streak.ts';
import { grassForSubmission } from '../../../features/pet/domain/mining.ts';
import { getLesson, getNextLesson, getQuestions } from '../_shared/content.ts';

/*
 * 레슨 제출을 채점하고 XP·스트릭·진도를 확정하는 곳. (기획서 2번 아키텍처 원칙)
 *
 * 클라이언트는 각 문제에 고른 답만 보낸다. 정답 여부·XP·스트릭은 전부
 * 여기서 다시 계산한다 — 클라이언트가 계산한 점수는 신뢰하지 않는다.
 * scoring.ts/streak.ts는 앱이 화면 피드백에 쓰는 파일과 완전히 같은 파일을
 * 그대로 import하므로, 클라이언트 미리보기와 서버 확정값이 규칙 자체는
 * 항상 일치한다(클라 계산을 "신뢰"하는 것과는 다르다 — 값은 여기서 새로 만든다).
 *
 * progress/daily_xp/profiles 쓰기는 이 함수(service_role)만 할 수 있다.
 * RLS가 일반 클라이언트의 직접 쓰기를 막고 있다. (0001_init.sql)
 * 실제 저장은 apply_lesson_result DB 함수가 한 트랜잭션으로 한다.
 * 게스트가 받은 XP는 guest_xp에도 쌓여서, 계정 연결 시 20%를 돌려받는다. (0002)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitAnswerBody {
  lessonId: string;
  answers: Record<string, number | number[]>;
}

function isSubmitAnswerBody(value: unknown): value is SubmitAnswerBody {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.lessonId === 'string' && typeof v.answers === 'object' && v.answers !== null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** 한 번 계산한 결과를 저장하려다 다른 제출과 겹치면(conflict) 다시 읽고 계산한다 */
const MAX_ATTEMPTS = 3;

interface ApplyResult {
  conflict?: boolean;
  is_anonymous?: boolean;
  error?: string;
  total_xp?: number;
  level?: number;
  streak?: number;
  max_streak?: number;
  coins?: number;
  grass?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 이 요청을 보낸 사람이 누구인지는 유저 권한 클라이언트로만 확인한다.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: '로그인이 필요해요' }, 401);
    }

    const body = await req.json().catch(() => null);
    if (!isSubmitAnswerBody(body)) {
      return json({ error: '요청 형식이 잘못됐어요' }, 400);
    }

    const lesson = getLesson(body.lessonId);
    const questions = getQuestions(body.lessonId);
    if (!lesson || questions.length === 0) {
      return json({ error: '존재하지 않는 레슨이에요' }, 400);
    }

    // 실제 쓰기는 전부 service_role로 한다 (RLS를 우회하는 유일한 경로).
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 채점은 서버가 다시 한다 — 클라이언트가 보낸 정답 개수는 아예 안 받는다.
    let correctCount = 0;
    const wrongQuestionIds: string[] = [];
    for (const q of questions) {
      const submitted = body.answers[q.id];
      if (submitted !== undefined && isCorrect(q, submitted)) {
        correctCount += 1;
      } else {
        wrongQuestionIds.push(q.id);
      }
    }
    const totalCount = questions.length;
    const nextLesson = getNextLesson(body.lessonId);
    let isAnonymous = user.is_anonymous === true;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const today = toKstDateString();

      const [profileRes, progressRes, dailyRes] = await Promise.all([
        admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        admin
          .from('progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('lesson_id', body.lessonId)
          .maybeSingle(),
        admin
          .from('daily_xp')
          .select('xp, goal_bonus_given')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle(),
      ]);

      // 읽기 실패를 "행 없음"으로 착각하면 XP를 다시 주거나 하루 XP를 덮어쓴다 — 그냥 실패로 끝낸다.
      if (profileRes.error) throw profileRes.error;
      if (progressRes.error) throw progressRes.error;
      if (dailyRes.error) throw dailyRes.error;

      const profile = profileRes.data;
      if (!profile) {
        return json({ error: '프로필을 찾을 수 없어요' }, 500);
      }

      const alreadyCompleted = progressRes.data?.completed === true;
      const preXp = dailyRes.data?.xp ?? 0;
      const goalAlreadyGiven = dailyRes.data?.goal_bonus_given ?? false;

      // 하루 목표 보너스 여부를 판단하려면, 그 보너스를 뺀 XP를 먼저 알아야 한다.
      const partial = calculateXp({
        correctCount,
        totalCount,
        alreadyCompleted,
        isAnonymous,
        reachesDailyGoalFirstTime: false,
      });
      const reachesGoal =
        !alreadyCompleted &&
        !goalAlreadyGiven &&
        preXp + partial.lessonXp + partial.perfectBonus >= profile.daily_goal;

      const xpInput = {
        correctCount,
        totalCount,
        alreadyCompleted,
        isAnonymous,
        reachesDailyGoalFirstTime: reachesGoal,
      };
      const xp = calculateXp(xpInput);
      const coins = calculateCoins(xpInput);
      // 오늘 첫 제출(출석)이면 고양이 먹이 잔디 (0005_pet_mining.sql)
      const grass = grassForSubmission(profile.last_study_date, today);

      const streak = updateStreak({
        currentStreak: profile.streak,
        lastStudyDate: profile.last_study_date,
        freezeCount: profile.freeze_count,
        today,
      });

      // 저장은 DB 함수가 한 트랜잭션으로 한다. 위 계산에 쓴 상태(p_seen_*)가
      // 그 사이 바뀌었으면 저장하지 않고 conflict를 돌려준다. (0002_guest_refund_and_atomic_submit.sql)
      const { data, error } = await admin.rpc('apply_lesson_result', {
        p_user: user.id,
        p_lesson: body.lessonId,
        p_next_lesson: nextLesson?.id ?? null,
        p_today: today,
        p_correct: correctCount,
        p_wrong_question_ids: wrongQuestionIds,
        p_was_anonymous: isAnonymous,
        p_xp: xp.total,
        p_reaches_goal: reachesGoal,
        p_streak: streak.streak,
        p_freeze_count: streak.freezeCount,
        p_seen_completed: alreadyCompleted,
        p_seen_daily_xp: preXp,
        p_seen_goal_given: goalAlreadyGiven,
        p_seen_streak: profile.streak,
        p_seen_last_study_date: profile.last_study_date,
        p_seen_freeze_count: profile.freeze_count,
        p_coins: coins,
        p_grass: grass,
      });
      if (error) throw error;

      const result = data as ApplyResult;
      if (result.error === 'profile_not_found') {
        return json({ error: '프로필을 찾을 수 없어요' }, 500);
      }
      if (result.conflict) {
        // 그 사이 계정 연결이 끝났을 수도 있으니 게스트 여부도 DB 값으로 맞춘다
        isAnonymous = result.is_anonymous === true;
        continue;
      }

      return json({
        correctCount,
        totalCount,
        alreadyCompleted,
        xp,
        coins,
        grass,
        streak,
        profile: {
          totalXp: result.total_xp,
          level: result.level,
          streak: result.streak,
          maxStreak: result.max_streak,
          coins: result.coins,
          grass: result.grass,
        },
        unlockedNextLessonId: nextLesson?.id ?? null,
      });
    }

    return json({ error: '다른 제출과 겹쳤어요. 다시 시도해주세요' }, 409);
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
