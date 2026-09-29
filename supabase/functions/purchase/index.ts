import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { catById, ownedCoinCatCount } from '../../../features/pet/domain/catSheet.ts';
import {
  COINS_PER_PRISM,
  catPrice,
  exchangeBlock,
} from '../../../features/shop/domain/shopItems.ts';

/*
 * 상점 — 고양이 구매(코인 고양이는 코인, 프리즘 고양이는 프리즘)와 프리즘 → 코인 교환.
 * (daon-content/재화_경제.md)
 *
 * 코인·프리즘은 클라이언트가 직접 못 바꾸므로(가드 트리거) 구매도 서버에서만 한다.
 * 가격은 앱 화면과 같은 shopItems.ts로 계산하고, 잔액 확인과 차감은 purchase_cat DB 함수가
 * 한 트랜잭션으로 한다. 가격을 계산할 때 본 보유 목록이 그 사이 바뀌면 DB 함수가 거절한다.
 * (0007_prisms.sql)
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
  not_enough_coins: '코인이 부족해요',
  not_enough_prisms: '프리즘이 부족해요',
  already_owned: '이미 가진 고양이예요',
  conflict: '다른 구매와 겹쳤어요. 다시 시도해주세요',
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

    const body = await req.json().catch(() => null);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 프리즘 → 코인 교환 (한 방향만)
    if (body?.item === 'coins') {
      const amount = Number(body.prisms);
      if (exchangeBlock(Number.MAX_SAFE_INTEGER, amount) === 'invalid') {
        return json({ error: '없는 상품이에요' }, 400);
      }
      const { data, error } = await admin.rpc('exchange_prisms', {
        p_user: user.id,
        p_prisms: amount,
        p_coins_per_prism: COINS_PER_PRISM,
      });
      if (error) throw error;
      if (data?.error) {
        return json({ error: ERROR_MESSAGES[data.error] ?? '바꾸지 못했어요' }, 400);
      }
      return json({ coins: data.coins, prisms: data.prisms });
    }

    const cat = body?.item === 'cat' ? catById(body.catId) : undefined;
    if (!cat) {
      return json({ error: '없는 상품이에요' }, 400);
    }
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('owned_cats')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    const owned: string[] = profile.owned_cats ?? [];
    const price = catPrice(cat.currency, ownedCoinCatCount(owned));

    const { data, error } = await admin.rpc('purchase_cat', {
      p_user: user.id,
      p_cat: cat.id,
      p_currency: cat.currency,
      p_price: price,
      p_seen_owned: owned,
    });
    if (error) throw error;

    if (data?.error) {
      const status = data.error === 'conflict' ? 409 : 400;
      return json({ error: ERROR_MESSAGES[data.error] ?? '구매하지 못했어요' }, status);
    }

    return json({ coins: data.coins, prisms: data.prisms, ownedCats: data.owned_cats });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
