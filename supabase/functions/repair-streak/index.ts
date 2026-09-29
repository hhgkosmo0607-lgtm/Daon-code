import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { toKstDateString } from '../../../features/lesson/domain/streak.ts';
import { STREAK_REPAIR_PRISMS } from '../../../features/shop/domain/shopItems.ts';

/*
 * 스트릭 지키기 — 딱 하루 빠졌을 때 사용자가 직접 프리즘을 써서 스트릭을 잇는다.
 * 자동으로 쓰지 않는다. 홈에서 "프리즘으로 지킬래요?"에 예를 누르면 불린다.
 * (daon-content/재화_경제.md, 0007_prisms.sql의 repair_streak)
 *
 * 날짜는 기기 시계가 아니라 서버 시각의 한국 날짜로 정한다.
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

const ERROR_MESSAGES: Record<string, string> = {
  not_needed: '지킬 스트릭이 없어요 (하루만 빠졌을 때 지킬 수 있어요)',
  not_enough_prisms: `프리즘이 부족해요 (${STREAK_REPAIR_PRISMS}개 필요)`,
  profile_not_found: '프로필을 찾을 수 없어요',
};

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

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.rpc('repair_streak', {
      p_user: user.id,
      p_today: toKstDateString(),
      p_cost: STREAK_REPAIR_PRISMS,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: ERROR_MESSAGES[data.error] ?? '스트릭을 지키지 못했어요' }, 400);
    }

    return json({ prisms: data.prisms, streak: data.streak });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
