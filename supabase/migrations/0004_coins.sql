-- ============================================
-- 코인 (daon-content/Daon-code_아이디어.md 1번 — 듀오링고식 보상 구조)
--
-- EXP(total_xp)는 레벨용으로 쌓이기만 하고, 코인은 모아서 상점에 쓰는 화폐다.
-- 지급 규칙은 scoring.ts의 calculateCoins가 정하고, 저장은 apply_lesson_result가
-- 한 트랜잭션으로 한다. 게스트는 80%만 받고, 계정 연결 시 XP와 함께 환급받는다.
--
-- 배포 순서: 이 마이그레이션 → submit-answer 함수.
-- p_coins에 기본값(0)을 둬서, 함수 배포 전 잠깐 동안 예전 함수가 불러도 제출이 실패하지 않는다.
-- ============================================

alter table public.profiles
  add column if not exists coins       int not null default 0,
  add column if not exists guest_coins int not null default 0;

-- 코인도 서버만 바꿀 수 있다 (0002의 가드에 coins, guest_coins 추가)
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
     or new.guest_xp     is distinct from old.guest_xp
     or new.coins        is distinct from old.coins
     or new.guest_coins  is distinct from old.guest_coins then
    raise exception 'xp/streak/coin 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;

-- 환급: 게스트로 깎인 XP와 코인을 같은 비율(guest_refund_bonus)로 돌려준다
create or replace function public.pay_guest_refund(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  g     int;
  gc    int;
  bonus int;
begin
  select guest_xp, guest_coins into g, gc from profiles where id = p_user for update;
  if coalesce(g, 0) <= 0 and coalesce(gc, 0) <= 0 then
    update profiles set guest_refunded_at = coalesce(guest_refunded_at, now()) where id = p_user;
    return 0;
  end if;

  bonus := guest_refund_bonus(coalesce(g, 0));
  update profiles
     set total_xp          = total_xp + bonus,
         level             = level_for_xp(total_xp + bonus),
         guest_xp          = 0,
         coins             = coins + guest_refund_bonus(coalesce(gc, 0)),
         guest_coins       = 0,
         guest_refunded_at = now()
   where id = p_user;
  return bonus;
end $$;

-- 인자가 하나 늘어나므로 예전 버전을 지우고 새로 만든다 (남겨두면 오버로드가 돼서 호출이 모호해진다)
drop function if exists public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int
);

create function public.apply_lesson_result(
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
  p_seen_freeze_count    int,
  p_coins                int default 0
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
         guest_xp        = guest_xp + case when p_was_anonymous then p_xp else 0 end,
         coins           = coins + p_coins,
         guest_coins     = guest_coins + case when p_was_anonymous then p_coins else 0 end
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
  if not coalesce(is_anon, false) and (prof.guest_xp > 0 or prof.guest_coins > 0) then
    perform pay_guest_refund(p_user);
    select * into prof from profiles where id = p_user;
  end if;

  return jsonb_build_object(
    'total_xp',   prof.total_xp,
    'level',      prof.level,
    'streak',     prof.streak,
    'max_streak', prof.max_streak,
    'coins',      prof.coins
  );
end $$;

-- SECURITY DEFINER 함수는 Edge Function(service_role)만 부를 수 있게 한다.
revoke all on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int, int
) from public, anon, authenticated;
grant execute on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int, int
) to service_role;
