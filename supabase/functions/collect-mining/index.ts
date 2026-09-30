import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { PET_POWER } from '../../../features/pet/domain/petCatalog.ts';
import {
  BASE_PER_HOUR,
  MAX_HOURS,
  PER_POWER_PER_HOUR,
  POINTS_PER_PRISM,
  TEAM_MAX,
} from '../../../features/pet/domain/mining.ts';

/*
 * 채굴 받기 — 팀 펫이 지난번에 받은 뒤로 캔 만큼(최대 24시간치) 게이지를 쌓고,
 * 가득 차면 프리즘을 준다. 앱은 홈에 들어올 때마다 불러도 된다 (자주 부르면 조금씩 받는다).
 * 시간은 서버 now()로 잰다 — 기기 시계를 바꿔도 소용없다. (daon-content/재화_경제.md, 0009_time_mining.sql)
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

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.rpc('collect_mining', {
      p_user: user.id,
      p_base_per_hour: BASE_PER_HOUR,
      p_per_power_per_hour: PER_POWER_PER_HOUR,
      p_points_per_prism: POINTS_PER_PRISM,
      p_max_hours: MAX_HOURS,
      p_pet_power: PET_POWER,
      p_team_max: TEAM_MAX,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: '프로필을 찾을 수 없어요' }, 500);
    }

    return json({
      hours: Number(data.hours),
      gained: Number(data.gained),
      minted: data.minted,
      team: data.team,
      minePoints: Number(data.mine_points),
      prisms: data.prisms,
      collectedAt: data.collected_at,
    });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
