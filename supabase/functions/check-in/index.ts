import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { toKstDateString } from '../../../features/lesson/domain/streak.ts';
import { MINE_BASE, MINE_PER_CAT, MINE_PER_PRISM } from '../../../features/pet/domain/mining.ts';

/*
 * 하루 한 번 출석 — 그날 처음 앱에 들어오면 고양이들이 캔 만큼 채굴 게이지가 차고,
 * 가득 차면 프리즘이 나온다. 레슨을 풀지 않아도 준다. (daon-content/재화_경제.md)
 *
 * 앱은 홈에 들어올 때마다 불러도 되고, 하루 한 번만 주는 판단은 check_in DB 함수가 한다.
 * 날짜는 기기 시계가 아니라 서버 시각의 한국 날짜로 정한다. (0007_prisms.sql)
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
    const { data, error } = await admin.rpc('check_in', {
      p_user: user.id,
      p_today: toKstDateString(),
      p_mine_base: MINE_BASE,
      p_mine_per_cat: MINE_PER_CAT,
      p_mine_per_prism: MINE_PER_PRISM,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: '프로필을 찾을 수 없어요' }, 500);
    }

    return json({
      gain: data.gain,
      minted: data.minted,
      cats: data.cats,
      mineProgress: data.mine_progress,
      prisms: data.prisms,
    });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
