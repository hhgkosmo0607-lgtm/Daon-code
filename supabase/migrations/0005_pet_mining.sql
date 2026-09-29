-- ============================================
-- 고양이 채굴 (daon-content/Daon-code_아이디어.md 2-A)
--
-- 출석(그날 첫 제출) → 잔디(먹이) +1
-- 먹이 주기 → 잔디 -1, 채굴 게이지 +N, 게이지가 가득 차면 스트릭 프리즈 +1,
--             고양이가 정해진 시간 동안 일한다(pet_working_until). 안 먹이면 계속 쉰다.
-- 수치는 features/pet/domain/mining.ts가 정하고 Edge Function이 넘긴다.
--
-- 배포 순서: 이 마이그레이션 → submit-answer·feed-pet 함수.
-- p_grass에 기본값(0)을 둬서, 함수 배포 전 잠깐 동안 예전 함수가 불러도 제출이 실패하지 않는다.
-- ============================================

alter table public.profiles
  add column if not exists grass             int not null default 0,
  add column if not exists mine_progress     int not null default 0,
  add column if not exists pet_working_until timestamptz;

-- 잔디·채굴도 서버만 바꿀 수 있다 (0004의 가드에 grass, mine_progress, pet_working_until 추가)
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
     or new.guest_coins  is distinct from old.guest_coins
     or new.grass        is distinct from old.grass
     or new.mine_progress is distinct from old.mine_progress
     or new.pet_working_until is distinct from old.pet_working_until then
    raise exception 'xp/streak/coin/펫 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;


-- 출석 잔디(p_grass)를 받도록 인자를 하나 늘린다 (예전 버전은 지워야 오버로드로 모호해지지 않는다)
drop function if exists public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int, int
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
  p_coins                int default 0,
  p_grass                int default 0
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
         guest_coins     = guest_coins + case when p_was_anonymous then p_coins else 0 end,
         grass           = grass + p_grass
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
    'coins',      prof.coins,
    'grass',      prof.grass
  );
end $$;

-- SECURITY DEFINER 함수는 Edge Function(service_role)만 부를 수 있게 한다.
revoke all on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int, int, int
) from public, anon, authenticated;
grant execute on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int, int, int
) to service_role;

-- ---------- 먹이 주기 ----------
-- 잔디 확인 → 차감 → 게이지·프리즈 지급 → 일하는 시간 연장을 프로필 행을 잠근 채 한 번에 한다.
create or replace function public.feed_pet(
  p_user          uuid,
  p_mine_per_grass int,
  p_mine_per_freeze int,
  p_freeze_max    int,
  p_work_hours    int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof   profiles%rowtype;
  gauge  int;
  minted int := 0;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  if prof.grass < 1 then
    return jsonb_build_object('error', 'no_grass');
  end if;
  if prof.freeze_count >= p_freeze_max then
    return jsonb_build_object('error', 'freeze_full');
  end if;

  gauge := prof.mine_progress + p_mine_per_grass;
  while gauge >= p_mine_per_freeze and prof.freeze_count + minted < p_freeze_max loop
    gauge  := gauge - p_mine_per_freeze;
    minted := minted + 1;
  end loop;
  -- 프리즈가 가득 차서 못 받은 만큼은 게이지에 한 번 분량까지만 남긴다
  gauge := least(gauge, p_mine_per_freeze);

  update profiles
     set grass             = grass - 1,
         mine_progress     = gauge,
         freeze_count      = freeze_count + minted,
         pet_working_until = greatest(coalesce(pet_working_until, now()), now())
                             + make_interval(hours => p_work_hours)
   where id = p_user
  returning * into prof;

  return jsonb_build_object(
    'grass',             prof.grass,
    'mine_progress',     prof.mine_progress,
    'freeze_count',      prof.freeze_count,
    'pet_working_until', prof.pet_working_until,
    'minted',            minted
  );
end $$;

revoke all on function public.feed_pet(uuid, int, int, int, int) from public, anon, authenticated;
grant execute on function public.feed_pet(uuid, int, int, int, int) to service_role;
