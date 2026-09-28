-- ============================================
-- 0002 이전에 이미 계정을 연결한 전 게스트 환급 (0002의 (b)를 바로잡는다)
--
-- 0002는 profiles.provider = 'anonymous'로 전 게스트를 찾았는데, 실제로는
-- handle_new_user가 익명 가입자도 provider를 'email'로 저장해서 아무도 찾지 못했다.
-- (지급된 사람이 없으므로 되돌릴 것은 없다)
--
-- 이제는 로그인 수단(auth.identities)이 계정 생성보다 늦게 처음 붙은 사람을
-- 전 게스트로 본다. 익명 계정에는 identity가 없고, 이메일을 연결할 때 처음 생긴다.
-- 처음부터 이메일/소셜로 가입한 사람은 계정과 identity가 같은 순간 만들어진다.
--
-- 환급한 사람은 guest_refunded_at으로 표시해서, 이 파일을 다시 실행하거나
-- 트리거와 겹쳐도 두 번 지급되지 않는다.
-- ============================================

alter table public.profiles
  add column if not exists guest_refunded_at timestamptz;

-- 트리거·재시도 경로도 환급 완료를 표시한다 (환급액이 0이어도)
create or replace function public.pay_guest_refund(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  g     int;
  bonus int;
begin
  select guest_xp into g from profiles where id = p_user for update;
  if coalesce(g, 0) <= 0 then
    update profiles set guest_refunded_at = coalesce(guest_refunded_at, now()) where id = p_user;
    return 0;
  end if;

  bonus := guest_refund_bonus(g);
  update profiles
     set total_xp          = total_xp + bonus,
         level             = level_for_xp(total_xp + bonus),
         guest_xp          = 0,
         guest_refunded_at = now()
   where id = p_user;
  return bonus;
end $$;

-- provider는 익명 가입자도 'email'이라 바꿀 필요가 없다 — 환급만 한다
create or replace function public.refund_guest_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pay_guest_refund(new.id);
  return new;
exception when others then
  -- 환급이 실패해도 계정 연결(인증) 자체는 막지 않는다.
  -- guest_xp가 남아 있으므로 다음 레슨 제출 때 apply_lesson_result가 다시 지급한다.
  raise warning 'refund_guest_xp failed for %: %', new.id, sqlerrm;
  return new;
end $$;

-- ---------- 기존 데이터 환급 ----------
-- 연결일(한국 날짜)까지의 daily_xp를 게스트 XP로 본다. 연결 당일 XP도 게스트 XP로 쳐서
-- 애매하면 사용자에게 유리하게 계산한다.
-- 0002 적용(2026-09-28 11:30 KST 이후) 뒤에 연결한 사람은 트리거가 이미 환급했으므로 뺀다.
do $$
declare
  refunded int;
begin
  with first_identity as (
    select i.user_id, min(i.created_at) as linked_at
      from auth.identities i
     group by i.user_id
  ), converted as (
    select p.id,
           (coalesce(u.email_confirmed_at, f.linked_at) at time zone 'Asia/Seoul')::date as linked_on
      from public.profiles p
      join auth.users u      on u.id = p.id
      join first_identity f  on f.user_id = p.id
     where not u.is_anonymous
       and p.guest_refunded_at is null
       and f.linked_at > u.created_at + interval '1 minute'
       and f.linked_at < timestamptz '2026-09-28 11:30:00+09'
  ), earned as (
    select c.id, coalesce(sum(d.xp), 0)::int as g
      from converted c
      left join public.daily_xp d on d.user_id = c.id and d.date <= c.linked_on
     group by c.id
  )
  update public.profiles p
     set total_xp          = p.total_xp + public.guest_refund_bonus(e.g),
         level             = public.level_for_xp(p.total_xp + public.guest_refund_bonus(e.g)),
         guest_xp          = 0,
         guest_refunded_at = now()
    from earned e
   where p.id = e.id;

  get diagnostics refunded = row_count;
  raise notice '전 게스트 환급 대상: %명', refunded;
end $$;
