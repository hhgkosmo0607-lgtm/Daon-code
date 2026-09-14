import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.116.0';

import { calculateXp, isCorrect, levelFromXp } from '../../../features/lesson/domain/scoring.ts';
import { toKstDateString, updateStreak } from '../../../features/lesson/domain/streak.ts';
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

/** 오답 노트(wrong_answers) 갱신 — 기존 오답 횟수에 이어서 누적한다 */
async function upsertWrongAnswers(admin: SupabaseClient, userId: string, questionIds: string[]) {
  const { data: existing } = await admin
    .from('wrong_answers')
    .select('question_id, wrong_count')
    .eq('user_id', userId)
    .in('question_id', questionIds);

  const countMap = new Map((existing ?? []).map((r) => [r.question_id, r.wrong_count]));

  const rows = questionIds.map((qid) => ({
    user_id: userId,
    question_id: qid,
    wrong_count: (countMap.get(qid) ?? 0) + 1,
    last_wrong: new Date().toISOString(),
  }));

  return admin.from('wrong_answers').upsert(rows, { onConflict: 'user_id,question_id' });
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
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
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

    const [{ data: profile, error: profileError }, { data: progressRow }] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', body.lessonId)
        .maybeSingle(),
    ]);

    if (profileError || !profile) {
      return json({ error: '프로필을 찾을 수 없어요' }, 500);
    }

    const alreadyCompleted = progressRow?.completed === true;
    const isAnonymous = user.is_anonymous === true;
    const today = toKstDateString();

    const { data: dailyRow } = await admin
      .from('daily_xp')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    const preXp = dailyRow?.xp ?? 0;
    const goalAlreadyGiven = dailyRow?.goal_bonus_given ?? false;

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

    const xp = calculateXp({
      correctCount,
      totalCount,
      alreadyCompleted,
      isAnonymous,
      reachesDailyGoalFirstTime: reachesGoal,
    });

    const streak = updateStreak({
      currentStreak: profile.streak,
      lastStudyDate: profile.last_study_date,
      freezeCount: profile.freeze_count,
      today,
    });

    const newTotalXp = profile.total_xp + xp.total;
    const newMaxStreak = Math.max(profile.max_streak, streak.streak);
    const nextLesson = getNextLesson(body.lessonId);

    const [progressResult, dailyResult, profileResult, nextLessonResult, wrongAnswersResult] =
      await Promise.all([
        admin.from('progress').upsert(
          {
            user_id: user.id,
            lesson_id: body.lessonId,
            completed: true,
            best_score: Math.max(progressRow?.best_score ?? 0, correctCount),
            attempts: (progressRow?.attempts ?? 0) + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        ),
        admin.from('daily_xp').upsert(
          {
            user_id: user.id,
            date: today,
            xp: preXp + xp.total,
            goal_bonus_given: goalAlreadyGiven || reachesGoal,
          },
          { onConflict: 'user_id,date' }
        ),
        admin
          .from('profiles')
          .update({
            total_xp: newTotalXp,
            level: levelFromXp(newTotalXp),
            streak: streak.streak,
            max_streak: newMaxStreak,
            freeze_count: streak.freezeCount,
            last_study_date: today,
          })
          .eq('id', user.id),
        // 다음 레슨은 아직 행이 없을 때만 만든다 — 이미 있으면(완료 포함) 건드리지 않는다.
        nextLesson
          ? admin
              .from('progress')
              .upsert(
                { user_id: user.id, lesson_id: nextLesson.id, completed: false, attempts: 0 },
                { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
              )
          : Promise.resolve({ error: null }),
        wrongQuestionIds.length > 0
          ? upsertWrongAnswers(admin, user.id, wrongQuestionIds)
          : Promise.resolve({ error: null }),
      ]);

    if (progressResult.error) throw progressResult.error;
    if (dailyResult.error) throw dailyResult.error;
    if (profileResult.error) throw profileResult.error;
    if (nextLessonResult.error) throw nextLessonResult.error;
    if (wrongAnswersResult.error) throw wrongAnswersResult.error;

    return json({
      correctCount,
      totalCount,
      alreadyCompleted,
      xp,
      streak,
      profile: {
        totalXp: newTotalXp,
        level: levelFromXp(newTotalXp),
        streak: streak.streak,
        maxStreak: newMaxStreak,
      },
      unlockedNextLessonId: nextLesson?.id ?? null,
    });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
