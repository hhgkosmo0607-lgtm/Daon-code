import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import {
  FREEZE_OVERFLOW_COINS,
  MINE_BASE,
  MINE_PER_CAT,
  MINE_PER_FREEZE,
  WORK_HOURS_PER_GRASS,
} from '../../../features/pet/domain/mining.ts';
import { FREEZE_MAX } from '../../../features/shop/domain/shopItems.ts';

/*
 * 고양이에게 잔디(먹이) 1개 주기. (daon-content/Daon-code_아이디어.md 2-A)
 *
 * 잔디·게이지·프리즈는 클라이언트가 직접 못 바꾸므로(가드 트리거) 서버에서만 한다.
 * 수치는 앱 화면과 같은 mining.ts에서 가져오고, 확인·차감·지급은 feed_pet DB 함수가
 * 한 트랜잭션으로 한다. (0006_checkin_and_cats.sql — 고양이 수만큼 더 캐고, 넘친 프리즈는 코인)
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
  no_grass: '먹일 잔디가 없어요 · 매일 앱에 들어오면 하루 한 번 받아요',
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
    const { data, error } = await admin.rpc('feed_pet', {
      p_user: user.id,
      p_mine_base: MINE_BASE,
      p_mine_per_cat: MINE_PER_CAT,
      p_mine_per_freeze: MINE_PER_FREEZE,
      p_freeze_max: FREEZE_MAX,
      p_work_hours: WORK_HOURS_PER_GRASS,
      p_overflow_coins: FREEZE_OVERFLOW_COINS,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: ERROR_MESSAGES[data.error] ?? '먹이를 주지 못했어요' }, 400);
    }

    return json({
      grass: data.grass,
      mineProgress: data.mine_progress,
      freezeCount: data.freeze_count,
      petWorkingUntil: data.pet_working_until,
      coins: data.coins,
      gain: data.gain,
      minted: data.minted,
      overflowCoins: data.overflow_coins,
    });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
