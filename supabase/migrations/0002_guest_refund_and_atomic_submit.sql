-- ============================================
-- 1) 게스트 XP 환급 (기획서 6번: "게스트로 놓친 XP를 돌려받아요")
--
-- 게스트(익명) 상태에서 받은 XP를 profiles.guest_xp에 따로 쌓아두고,
-- 계정 연결이 끝나 auth.users.is_anonymous가 false로 바뀌는 순간
-- 트리거가 깎였던 20%만큼을 total_xp에 더하고 guest_xp를 0으로 되돌린다.
-- 트리거가 실패해도 계정 연결은 막지 않고, 다음 레슨 제출 때 다시 지급한다.
--
-- 2) 레슨 제출 결과를 한 트랜잭션으로 저장 (apply_lesson_result)
--
-- 예전 submit-answer는 프로필을 읽고 → 계산하고 → 테이블 5개에 따로따로 썼다.
-- 그래서 같은 사람의 제출이 겹치면 XP가 덮어써지고, 중간에 하나가 실패하면
-- "레슨은 완료인데 XP는 안 들어간" 상태가 남았다.
-- 이제 XP·스트릭 계산은 그대로 Edge Function(scoring.ts/streak.ts)이 하고,
-- 저장만 이 함수가 프로필 행을 잠근 채 한 번에 한다. 계산할 때 본 상태가
-- 그 사이 바뀌었으면 저장하지 않고 conflict를 돌려줘서 Edge Function이 다시 계산한다.
--
-- 이 파일은 여러 번 실행해도 결과가 같다(기존 데이터 환급도 한 번만 지급된다).
-- ============================================

alter table public.profiles
  add column if not exists guest_xp int not null default 0;

-- ---------- 공통 규칙 ----------
-- scoring.ts의 levelFromXp(XP_PER_LEVEL=100), calculatePendingBonus(GUEST_XP_RATE=0.8)와
-- 같은 규칙이다. 그쪽 숫자를 바꾸면 여기 두 함수도 같이 바꿔야 한다.
create or replace function public.level_for_xp(xp int)
returns int language sql immutable as $$
  select greatest(xp, 0) / 100 + 1
$$;

create or replace function public.guest_refund_bonus(guest_xp int)
returns int language sql immutable as $$
  select greatest(0, round(guest_xp / 0.8)::int - guest_xp)
$$;

-- xp/streak 컬럼은 서버만 바꿀 수 있다. guest_xp를 추가한다.
-- 서버로 인정하는 경우:
--  - Edge Function (JWT role = service_role)
--  - API 요청이 아닌 DB 내부 실행 (JWT 없음 + postgres): 마이그레이션, 계정 연결 시
--    Auth 서버가 일으키는 환급 트리거
-- 클라이언트가 API로 부르는 요청에는 항상 JWT가 붙으므로, 나중에 postgres 소유
-- SECURITY DEFINER 함수가 생겨도 그 경로로는 이 가드를 통과하지 못한다.
create or replace function public.guard_profile_xp_columns()
returns trigger language plpgsql as $$
declare
  jwt_role text := nullif(current_setting('request.jwt.claims', true), '')::json->>'role';
begin
  if jwt_role = 'service_role'
     or (jwt_role is null and current_user in ('postgres', 'service_role')) then
    return new;
  end if;

  if new.total_xp        is distinct from old.total_xp
     or new.level        is distinct from old.level
     or new.streak       is distinct from old.streak
     or new.max_streak   is distinct from old.max_streak
     or new.last_study_date is distinct from old.last_study_date
     or new.freeze_count is distinct from old.freeze_count
     or new.guest_xp     is distinct from old.guest_xp then
    raise exception 'xp/streak 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;

-- ---------- 환급 ----------
-- 남은 guest_xp를 환급하고 0으로 만든다. 돌려준 XP를 반환한다.
create or replace function public.pay_guest_refund(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  g     int;
  bonus int;
begin
  select guest_xp into g from profiles where id = p_user for update;
  if coalesce(g, 0) <= 0 then
    return 0;
  end if;

  bonus := guest_refund_bonus(g);
  update profiles
     set total_xp = total_xp + bonus,
         level    = level_for_xp(total_xp + bonus),
         guest_xp = 0
   where id = p_user;
  return bonus;
end $$;

-- 계정 연결 시: 환급하고, provider를 실제 연결 방식으로 바꾼다(환급액이 0이어도).
-- provider가 'anonymous'로 남지 않아야 아래 기존 데이터 환급이 다시 실행돼도 겹치지 않는다.
create or replace function public.refund_guest_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles
     set provider = coalesce(nullif(new.raw_app_meta_data->>'provider', 'anonymous'), 'email')
   where id = new.id and provider = 'anonymous';
  perform pay_guest_refund(new.id);
  return new;
exception when others then
  -- 환급이 실패해도 계정 연결(인증) 자체는 막지 않는다.
  -- guest_xp가 남아 있으므로 다음 레슨 제출 때 apply_lesson_result가 다시 지급한다.
  raise warning 'refund_guest_xp failed for %: %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists on_guest_upgraded on auth.users;
create trigger on_guest_upgraded
  after update of is_anonymous on auth.users
  for each row
  when (old.is_anonymous and not new.is_anonymous)
  execute function public.refund_guest_xp();

-- ---------- 기존 데이터 정리 ----------
-- (a) 지금 게스트인 사람: 쌓인 XP 전부가 게스트 시절 XP다.
--     provider는 가입 시점 값이라 계정을 연결한 사람도 'anonymous'로 남아 있으므로
--     auth.users.is_anonymous로 판단한다.
update public.profiles p
   set guest_xp = p.total_xp
  from auth.users u
 where u.id = p.id and u.is_anonymous and p.guest_xp = 0;

-- (b) 이 마이그레이션 전에 이미 계정을 연결한 전 게스트: 트리거가 발동할 일이 없으므로
--     여기서 한 번 환급한다. 연결일(이메일 인증일, 한국 날짜)까지의 daily_xp를 게스트 XP로 본다.
--     연결 당일 XP도 게스트 XP로 쳐서, 애매하면 사용자에게 유리하게 계산한다.
--     대상자는 환급액과 상관없이 provider가 바뀌므로 다시 실행해도 두 번 지급되지 않는다.
with converted as (
  select p.id,
         coalesce(nullif(u.raw_app_meta_data->>'provider', 'anonymous'), 'email') as linked_provider,
         (coalesce(u.email_confirmed_at, u.updated_at) at time zone 'Asia/Seoul')::date as linked_on
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.provider = 'anonymous'
     and not u.is_anonymous
), earned as (
  select c.id, c.linked_provider, coalesce(sum(d.xp), 0)::int as g
    from converted c
    left join public.daily_xp d on d.user_id = c.id and d.date <= c.linked_on
   group by c.id, c.linked_provider
)
update public.profiles p
   set total_xp = p.total_xp + public.guest_refund_bonus(e.g),
       level    = public.level_for_xp(p.total_xp + public.guest_refund_bonus(e.g)),
       guest_xp = 0,
       provider = e.linked_provider
  from earned e
 where p.id = e.id;

-- ---------- 레슨 제출 저장 ----------
create or replace function public.apply_lesson_result(
  p_user                 uuid,
  p_lesson               text,
  p_next_lesson          text,
  p_today                date,
  p_correct              int,
  p_wrong_question_ids   text[],
  p_was_anonymous        boolean,
  p_xp                   int,
  p_reaches_goal         boolean,
  p_streak               int,
  p_freeze_count         int,
  -- 위 값을 계산할 때 본 상태. 그 사이 바뀌었으면 저장하지 않는다.
  p_seen_completed       boolean,
  p_seen_daily_xp        int,
  p_seen_goal_given      boolean,
  p_seen_streak          int,
  p_seen_last_study_date date,
  p_seen_freeze_count    int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof           profiles%rowtype;
  is_anon        boolean;
  cur_completed  boolean;
  cur_daily_xp   int;
  cur_goal_given boolean;
begin
  -- 같은 사람의 제출은 여기서 한 줄로 선다 (다른 제출·환급 트리거도 이 행을 잠근다)
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  select u.is_anonymous into is_anon from auth.users u where u.id = p_user;
  select completed into cur_completed from progress where user_id = p_user and lesson_id = p_lesson;
  select xp, goal_bonus_given into cur_daily_xp, cur_goal_given
    from daily_xp where user_id = p_user and date = p_today;

  if coalesce(is_anon, false) is distinct from p_was_anonymous
     or coalesce(cur_completed, false) is distinct from p_seen_completed
     or coalesce(cur_daily_xp, 0) is distinct from p_seen_daily_xp
     or coalesce(cur_goal_given, false) is distinct from p_seen_goal_given
     or prof.streak is distinct from p_seen_streak
     or prof.last_study_date is distinct from p_seen_last_study_date
     or prof.freeze_count is distinct from p_seen_freeze_count then
    return jsonb_build_object('conflict', true, 'is_anonymous', coalesce(is_anon, false));
  end if;

  insert into progress (user_id, lesson_id, completed, best_score, attempts, updated_at)
  values (p_user, p_lesson, true, p_correct, 1, now())
  on conflict (user_id, lesson_id) do update
    set completed  = true,
        best_score = greatest(coalesce(progress.best_score, 0), excluded.best_score),
        attempts   = progress.attempts + 1,
        updated_at = now();

  insert into daily_xp (user_id, date, xp, goal_bonus_given)
  values (p_user, p_today, p_xp, p_reaches_goal)
  on conflict (user_id, date) do update
    set xp               = daily_xp.xp + excluded.xp,
        goal_bonus_given = daily_xp.goal_bonus_given or excluded.goal_bonus_given;

  update profiles
     set total_xp        = total_xp + p_xp,
         level           = level_for_xp(total_xp + p_xp),
         streak          = p_streak,
         max_streak      = greatest(max_streak, p_streak),
         freeze_count    = p_freeze_count,
         last_study_date = p_today,
         guest_xp        = guest_xp + case when p_was_anonymous then p_xp else 0 end
   where id = p_user
  returning * into prof;

  -- 다음 레슨은 아직 행이 없을 때만 연다 — 이미 있으면(완료 포함) 건드리지 않는다.
  if p_next_lesson is not null then
    insert into progress (user_id, lesson_id, completed, attempts)
    values (p_user, p_next_lesson, false, 0)
    on conflict (user_id, lesson_id) do nothing;
  end if;

  -- 오답 노트: 기존 오답 횟수에 이어서 누적한다
  if coalesce(array_length(p_wrong_question_ids, 1), 0) > 0 then
    insert into wrong_answers (user_id, question_id, wrong_count, last_wrong)
    select p_user, qid, 1, now() from unnest(p_wrong_question_ids) as qid
    on conflict (user_id, question_id) do update
      set wrong_count = wrong_answers.wrong_count + 1,
          last_wrong  = now();
  end if;

  -- 계정 연결 트리거의 환급이 실패했던 사람은 여기서 다시 지급한다
  if not coalesce(is_anon, false) and prof.guest_xp > 0 then
    perform pay_guest_refund(p_user);
    select * into prof from profiles where id = p_user;
  end if;

  return jsonb_build_object(
    'total_xp',   prof.total_xp,
    'level',      prof.level,
    'streak',     prof.streak,
    'max_streak', prof.max_streak
  );
end $$;

-- SECURITY DEFINER 함수는 Edge Function(service_role)만 부를 수 있게 한다.
-- (Supabase는 public 스키마 함수에 anon/authenticated 실행 권한을 기본으로 준다)
revoke all on function public.pay_guest_refund(uuid) from public, anon, authenticated;
revoke all on function public.level_for_xp(int) from public, anon, authenticated;
revoke all on function public.guest_refund_bonus(int) from public, anon, authenticated;
revoke all on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int
) from public, anon, authenticated;
grant execute on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int
) to service_role;
