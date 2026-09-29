import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { CAT_COLORS } from '../../../features/pet/domain/catSheet.ts';
import {
  CAT_BASE_PRICE,
  CAT_PRICE_STEP,
  FREEZE_MAX,
  FREEZE_PRICE,
} from '../../../features/shop/domain/shopItems.ts';

/*
 * 상점 구매 — 스트릭 프리즘, 고양이. (daon-content/Daon-code_아이디어.md 1번)
 *
 * 코인은 클라이언트가 직접 못 바꾸므로(가드 트리거) 구매도 서버에서만 한다.
 * 가격·한도는 앱 화면과 같은 shopItems.ts에서 가져오고, 잔액 확인과 차감은
 * purchase_freeze DB 함수가 한 트랜잭션으로 한다. (0004_coins_and_shop.sql)
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
  not_enough_coins: `코인이 부족해요 (프리즘 ${FREEZE_PRICE}코인)`,
  max_reached: `프리즘은 최대 ${FREEZE_MAX}개까지 가질 수 있어요`,
  profile_not_found: '프로필을 찾을 수 없어요',
  already_owned: '이미 가진 고양이예요',
};

const CAT_IDS = CAT_COLORS.map((c) => c.id);

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
    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (body?.item === 'cat') {
      if (!CAT_IDS.includes(body.catId)) {
        return json({ error: '없는 고양이예요' }, 400);
      }
      const { data, error } = await admin.rpc('purchase_cat', {
        p_user: user.id,
        p_cat: body.catId,
        p_base_price: CAT_BASE_PRICE,
        p_price_step: CAT_PRICE_STEP,
      });
      if (error) throw error;
      if (data?.error) {
        const message =
          data.error === 'not_enough_coins'
            ? `코인이 부족해요 (다음 고양이 ${data.price}코인)`
            : (ERROR_MESSAGES[data.error] ?? '구매하지 못했어요');
        return json({ error: message }, 400);
      }
      return json({ coins: data.coins, ownedCats: data.owned_cats });
    }

    if (body?.item !== 'freeze') {
      return json({ error: '없는 상품이에요' }, 400);
    }

    const { data, error } = await admin.rpc('purchase_freeze', {
      p_user: user.id,
      p_price: FREEZE_PRICE,
      p_max: FREEZE_MAX,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: ERROR_MESSAGES[data.error] ?? '구매하지 못했어요' }, 400);
    }

    return json({ coins: data.coins, freezeCount: data.freeze_count });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
