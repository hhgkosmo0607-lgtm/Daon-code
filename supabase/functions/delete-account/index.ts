import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

/*
 * 계정 삭제 — 앱의 계정 화면에서 부른다.
 *
 * 구글 플레이·앱스토어는 계정을 만들 수 있는 앱이면 앱 안에서 계정을 지울 수
 * 있어야 한다. 게스트(익명) 계정도 똑같이 지울 수 있다.
 *
 * auth.users 행 하나만 지우면 된다. profiles·progress·daily_xp·wrong_answers·
 * user_term_review가 전부 auth.users를 on delete cascade로 참조하므로
 * 학습 기록·코인·프리즘·펫까지 함께 지워진다. (0001_init.sql)
 *
 * 실수로 불리지 않도록 요청 본문에 { confirm: "DELETE" }가 있어야만 지운다.
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

    // 누구의 계정인지는 요청에 실린 토큰으로만 판단한다 — 본문의 id는 받지 않는다.
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
    if (body?.confirm !== 'DELETE') {
      return json({ error: '삭제 확인이 필요해요' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: '계정을 삭제하지 못했어요. 잠시 후 다시 시도해주세요' }, 500);
  }
});
