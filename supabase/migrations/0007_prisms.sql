-- ============================================
-- 프리즘 (daon-content/재화_경제.md)
--
-- 스트릭 프리즈 → 프리즘으로 바꾼다.
--   - 이름: profiles.freeze_count → prisms (기존 개수는 그대로 옮겨진다)
--   - 보유 한도 없음. 고양이 채굴로 얻고, 스토어 출시 후 현금으로도 산다. 코인으로는 못 산다.
--   - 스트릭 자동 보호 없음. 하루 빠지면 사용자가 홈에서 프리즘을 써서 직접 지킨다 (repair_streak).
--   - 쓰는 곳: 스트릭 지키기, 프리즘 고양이(무지개)
--   - 먹이(잔디) 제거: 출석하면 고양이들이 알아서 캐서 게이지가 찬다 (check_in 교체)
--
-- 배포 순서: 이 마이그레이션 → submit-answer·purchase·check-in·repair-streak 함수 (feed-pet은 삭제).
-- 그 사이 몇 분은 예전 함수가 없는 인자로 불러서 제출·구매가 실패한다 (사용자 거의 없을 때 적용).
-- ============================================

alter table public.profiles rename column freeze_count to prisms;

-- 가드: freeze_count 대신 prisms, 지운 컬럼(grass, pet_working_until)은 뺀다
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
     or new.prisms       is distinct from old.prisms
     or new.guest_xp     is distinct from old.guest_xp
     or new.coins        is distinct from old.coins
     or new.guest_coins  is distinct from old.guest_coins
     or new.mine_progress is distinct from old.mine_progress
     or new.last_checkin_date is distinct from old.last_checkin_date
     or new.owned_cats   is distinct from old.owned_cats then
    raise exception 'xp/streak/coin/prism/펫 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;



-- ---------- 레슨 제출: 프리즘 자동 소모 제거 ----------
-- 스트릭 계산에서 프리즘을 빼서 p_freeze_count, p_seen_freeze_count가 없어지고,
-- 0006부터 안 쓰는 p_grass도 뺀다.
drop function if exists public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int, int,
  boolean, int, boolean, int, date, int, int, int
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
  -- 위 값을 계산할 때 본 상태. 그 사이 바뀌었으면 저장하지 않는다.
  p_seen_completed       boolean,
  p_seen_daily_xp        int,
  p_seen_goal_given      boolean,
  p_seen_streak          int,
  p_seen_last_study_date date,
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
     or prof.last_study_date is distinct from p_seen_last_study_date then
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

revoke all on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int,
  boolean, int, boolean, int, date, int
) from public, anon, authenticated;
grant execute on function public.apply_lesson_result(
  uuid, text, text, date, int, text[], boolean, int, boolean, int,
  boolean, int, boolean, int, date, int
) to service_role;

-- ---------- 코인으로 프리즘 사기 제거 ----------
drop function if exists public.purchase_freeze(uuid, int, int);

-- ---------- 먹이 없애기: 출석하면 고양이가 알아서 캔다 ----------
-- 잔디(먹이)·먹이 주기·일하는 시간을 없앤다. 출석(check_in) 때 게이지가 고양이 수만큼 찬다.
drop function if exists public.feed_pet(uuid, int, int, int, int, int, int);
drop function if exists public.check_in(uuid, date, int);

alter table public.profiles
  drop column if exists grass,
  drop column if exists pet_working_until;

-- 하루 한 번만: 오늘 이미 받았으면 아무것도 안 하고 gain=0
-- 수치는 features/pet/domain/mining.ts(applyCheckIn)가 정하고 check-in Edge Function이 넘긴다.
create function public.check_in(
  p_user           uuid,
  p_today          date,
  p_mine_base      int,
  p_mine_per_cat   int,
  p_mine_per_prism int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof   profiles%rowtype;
  cats   int;
  gain   int;
  gauge  int;
  minted int;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  cats := greatest(1, cardinality(prof.owned_cats));
  if prof.last_checkin_date = p_today then
    return jsonb_build_object('gain', 0, 'minted', 0, 'cats', cats,
                              'mine_progress', prof.mine_progress, 'prisms', prof.prisms);
  end if;

  gain   := p_mine_base + p_mine_per_cat * cats;
  gauge  := prof.mine_progress + gain;
  minted := gauge / p_mine_per_prism;

  update profiles
     set mine_progress     = gauge % p_mine_per_prism,
         prisms            = prisms + minted,
         last_checkin_date = p_today
   where id = p_user
  returning * into prof;

  return jsonb_build_object('gain', gain, 'minted', minted, 'cats', cats,
                            'mine_progress', prof.mine_progress, 'prisms', prof.prisms);
end $$;

revoke all on function public.check_in(uuid, date, int, int, int) from public, anon, authenticated;
grant execute on function public.check_in(uuid, date, int, int, int) to service_role;

-- ---------- 고양이 구매: 코인 고양이 / 프리즘 고양이 ----------
-- 가격은 features/shop/domain/shopItems.ts(catPrice)로 purchase Edge Function이 계산해서 넘긴다.
-- 가격을 계산할 때 본 보유 목록(p_seen_owned)이 그 사이 바뀌었으면 사지 않는다 (가격이 달라지므로).
drop function if exists public.purchase_cat(uuid, text, int, int);

create function public.purchase_cat(
  p_user       uuid,
  p_cat        text,
  p_currency   text,
  p_price      int,
  p_seen_owned text[]
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  if p_cat = any(prof.owned_cats) then
    return jsonb_build_object('error', 'already_owned');
  end if;
  if prof.owned_cats is distinct from p_seen_owned then
    return jsonb_build_object('error', 'conflict');
  end if;

  if p_currency = 'prism' then
    if prof.prisms < p_price then
      return jsonb_build_object('error', 'not_enough_prisms');
    end if;
    update profiles set prisms = prisms - p_price, owned_cats = owned_cats || p_cat
     where id = p_user returning * into prof;
  else
    if prof.coins < p_price then
      return jsonb_build_object('error', 'not_enough_coins');
    end if;
    update profiles set coins = coins - p_price, owned_cats = owned_cats || p_cat
     where id = p_user returning * into prof;
  end if;

  return jsonb_build_object('coins', prof.coins, 'prisms', prof.prisms, 'owned_cats', prof.owned_cats);
end $$;

revoke all on function public.purchase_cat(uuid, text, text, int, text[]) from public, anon, authenticated;
grant execute on function public.purchase_cat(uuid, text, text, int, text[]) to service_role;

-- ---------- 스트릭 지키기 ----------
-- 딱 하루 빠졌을 때(마지막 학습이 그저께)만 된다. 프리즘을 쓰고 마지막 학습일을 어제로 옮겨서,
-- 오늘 레슨을 풀면 스트릭이 +1로 이어진다. (features/lesson/domain/streak.ts의 streakStatus)
create or replace function public.repair_streak(p_user uuid, p_today date, p_cost int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  if prof.last_study_date is distinct from p_today - 2 then
    return jsonb_build_object('error', 'not_needed');
  end if;
  if prof.prisms < p_cost then
    return jsonb_build_object('error', 'not_enough_prisms');
  end if;

  update profiles
     set prisms          = prisms - p_cost,
         last_study_date = p_today - 1
   where id = p_user
  returning * into prof;

  return jsonb_build_object('prisms', prof.prisms, 'streak', prof.streak);
end $$;

revoke all on function public.repair_streak(uuid, date, int) from public, anon, authenticated;
grant execute on function public.repair_streak(uuid, date, int) to service_role;
