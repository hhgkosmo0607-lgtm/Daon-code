import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { TEAM_MAX } from '../../../features/pet/domain/mining.ts';

/*
 * 팀 정하기 — 화면에 나오고 출석 때 채굴하는 펫(최대 TEAM_MAX마리)을 고른다.
 * 채굴량이 달라지는 값이라 클라이언트가 직접 못 바꾸고(가드), set_team DB 함수가
 * 가진 펫인지·겹치지 않는지·개수를 확인한다. (daon-content/재화_경제.md, 0008_pets.sql)
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
    const team = Array.isArray(body?.team)
      ? body.team.filter((t: unknown) => typeof t === 'string')
      : [];

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.rpc('set_team', {
      p_user: user.id,
      p_team: team,
      p_team_max: TEAM_MAX,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: `팀은 가진 펫으로 1~${TEAM_MAX}마리까지 고를 수 있어요` }, 400);
    }
    return json({ teamPets: data.team_pets });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
