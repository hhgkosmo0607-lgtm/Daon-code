import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { toKstDateString } from '../../../features/lesson/domain/streak.ts';

/*
 * 운영자 테스트 도구 — 운영자 계정(profiles.is_admin)만 쓸 수 있다.
 * 앱의 테스트 메뉴(/admin)에서 부른다. 재화·출석·스트릭을 바로 만들어서
 * 상점·출석 채굴·스트릭 지키기 배너를 기다리지 않고 확인하는 용도다.
 *
 * is_admin은 가드 트리거로 본인이 못 켜고, 여기서도 DB 값을 다시 확인한다. (0007_prisms.sql)
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

/** 한국 날짜 YYYY-MM-DD에서 n일 전 */
function daysAgo(date: string, n: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() - n * 86_400_000)
    .toISOString()
    .slice(0, 10);
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

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('is_admin, coins, prisms, streak')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;
    if (!profile?.is_admin) {
      return json({ error: '운영자만 쓸 수 있어요' }, 403);
    }

    const body = await req.json().catch(() => null);
    const today = toKstDateString();
    let patch: Record<string, unknown>;

    switch (body?.action) {
      case 'grant': {
        const coins = Math.max(0, Math.min(100_000, Number(body.coins) || 0));
        const prisms = Math.max(0, Math.min(10_000, Number(body.prisms) || 0));
        patch = { coins: profile.coins + coins, prisms: profile.prisms + prisms };
        break;
      }
      case 'reset_checkin':
        // 오늘 출석 보상을 다시 받을 수 있게
        patch = { last_checkin_date: null };
        break;
      case 'miss_day':
        // 마지막 학습을 그저께로 → 홈에 "스트릭 지킬래요?" 배너가 뜬다
        patch = { last_study_date: daysAgo(today, 2), streak: Math.max(profile.streak, 3) };
        break;
      case 'reset_cats':
        patch = { owned_cats: ['orange'] };
        break;
      default:
        return json({ error: '없는 도구예요' }, 400);
    }

    const { error } = await admin.from('profiles').update(patch).eq('id', user.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
