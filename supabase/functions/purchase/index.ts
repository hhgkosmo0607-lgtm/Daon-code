import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

import { TEAM_MAX } from '../../../features/pet/domain/mining.ts';
import { petById } from '../../../features/pet/domain/petCatalog.ts';
import {
  COINS_PER_PRISM,
  exchangeBlock,
  petPrice,
} from '../../../features/shop/domain/shopItems.ts';

/*
 * 상점 — 펫 구매(코인 펫은 코인, 프리즘 펫은 프리즘)와 프리즘 → 코인 교환.
 * (daon-content/재화_경제.md)
 *
 * 코인·프리즘은 클라이언트가 직접 못 바꾸므로(가드 트리거) 구매도 서버에서만 한다.
 * 가격은 앱 화면과 같은 shopItems.ts(petPrice, 고정가)로 계산하고, 잔액 확인과 차감은
 * purchase_pet DB 함수가 한 트랜잭션으로 한다. 팀에 자리가 있으면 새 펫을 팀에도 넣는다.
 * (0008_pets.sql)
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
  already_owned: '이미 가진 펫이에요',
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

    const pet = body?.item === 'pet' ? petById(body.petId) : undefined;
    if (!pet) {
      return json({ error: '없는 상품이에요' }, 400);
    }

    const { data, error } = await admin.rpc('purchase_pet', {
      p_user: user.id,
      p_pet: pet.id,
      p_currency: pet.currency,
      p_price: petPrice(pet),
      p_team_max: TEAM_MAX,
    });
    if (error) throw error;

    if (data?.error) {
      return json({ error: ERROR_MESSAGES[data.error] ?? '구매하지 못했어요' }, 400);
    }

    return json({
      coins: data.coins,
      prisms: data.prisms,
      ownedPets: data.owned_pets,
      teamPets: data.team_pets,
    });
  } catch (error) {
    console.error(error);
    return json({ error: '서버 오류가 발생했어요' }, 500);
  }
});
