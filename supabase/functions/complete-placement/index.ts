import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.116.0';

import { getLessonsUpTo, getPlacementQuestions } from '../_shared/content.ts';
import { scorePlacementTest, startLessonFromScore } from '../_shared/placementScoring.ts';

/*
 * 배치고사 결과를 확정하고, 건너뛴 레슨들을 잠기지 않은 상태로 열어준다. (기획서 6번)
 *
 * 배치고사 경로는 "나중에 하기"가 없다 — 결과를 보려면 먼저 로그인해야 하므로,
 * 이 함수는 항상 로그인 직후(온보딩 위저드가 로그인 성공을 감지한 시점)에 호출된다.
 *
 * 클라이언트가 보낸 점수는 신뢰하지 않고 답안을 서버에서 다시 채점한다.
 * (submitAnswer와 같은 원칙 — 기획서 2번 아키텍처)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface CompletePlacementBody {
  answers: Record<string, number | number[]>;
}

function isCompletePlacementBody(value: unknown): value is CompletePlacementBody {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.answers === 'object' && v.answers !== null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    if (!isCompletePlacementBody(body)) {
      return json({ error: '요청 형식이 잘못됐어요' }, 400);
    }

    const questions = getPlacementQuestions();
    const consecutiveCorrect = scorePlacementTest(questions, body.answers);
    const startLessonId = startLessonFromScore(consecutiveCorrect);
    const skippedLessons = getLessonsUpTo(startLessonId);

    // 쓰기는 service_role로만 한다 (RLS가 일반 클라이언트의 progress 직접 쓰기를 막는다).
    const admin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // 이미 있는 행(진행 중이거나 완료된 레슨)은 건드리지 않고, 없는 것만 completed=false로 새로 연다.
    const rows = skippedLessons.map((lesson) => ({
      user_id: user.id,
      lesson_id: lesson.id,
      completed: false,
      attempts: 0,
    }));

    if (rows.length > 0) {
      const { error: upsertError } = await admin
        .from('progress')
        .upsert(rows, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });

      if (upsertError) throw upsertError;
    }

    return json({
      correctCount: consecutiveCorrect,
      totalCount: questions.length,
      startLessonId,
    });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
