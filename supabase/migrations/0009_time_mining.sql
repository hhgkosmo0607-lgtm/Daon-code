-- ============================================
-- 시간 채굴 (daon-content/재화_경제.md)
--
-- 하루 한 번 출석 때 한꺼번에 주던 채굴을, 팀 펫이 시간마다 캐서 쌓이는 방식으로 바꾼다.
--   - 시간당 게이지 = 기본 + 팀 채굴력 × 채굴력당, 게이지 100 = 프리즘 1개 (features/pet/domain/mining.ts)
--   - 앱을 켤 때 지난번에 받은 뒤로 쌓인 만큼 받는다. 최대 24시간치까지만 쌓인다.
--   - 시간은 서버 now()로 잰다 (폰 시계를 바꿔도 소용없다).
--
--   - mine_progress(게이지 0~9, 10이면 프리즘) → mine_points(0~100, 소수) — 기존 값은 ×10으로 옮긴다
--   - mine_collected_at: 마지막으로 채굴을 받은 시각. 처음엔 지금부터 쌓인다.
--   - last_checkin_date, check_in 삭제 — 새 함수 collect_mining
--
-- 배포 순서: 이 마이그레이션 → collect-mining·admin-tools 함수와 앱 업데이트 (check-in 함수는 삭제).
-- ============================================

alter table public.profiles rename column mine_progress to mine_points;
alter table public.profiles alter column mine_points type numeric(8,2) using mine_points * 10;
alter table public.profiles alter column mine_points set default 0;

alter table public.profiles
  add column if not exists mine_collected_at timestamptz not null default now();

-- 가드: mine_points·mine_collected_at, 지운 last_checkin_date는 뺀다
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
     or new.mine_points  is distinct from old.mine_points
     or new.mine_collected_at is distinct from old.mine_collected_at
     or new.owned_pets   is distinct from old.owned_pets
     or new.team_pets    is distinct from old.team_pets
     or new.is_admin     is distinct from old.is_admin then
    raise exception 'xp/streak/coin/prism/펫 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;

alter table public.profiles drop column if exists last_checkin_date;

drop function if exists public.check_in(uuid, date, int, int, int, jsonb, int);

-- ---------- 채굴 받기 ----------
-- 팀 중 실제로 가진 펫만, 앞에서부터 p_team_max마리의 채굴력으로, 지난번에 받은 뒤로 흐른 시간
-- (최대 p_max_hours)만큼 게이지를 더한다. 채굴력은 petCatalog.ts(PET_POWER)가 정하고 넘긴다. 표에 없으면 1.
create or replace function public.collect_mining(
  p_user                uuid,
  p_base_per_hour       numeric,
  p_per_power_per_hour  numeric,
  p_points_per_prism    int,
  p_max_hours           int,
  p_pet_power           jsonb,
  p_team_max            int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof      profiles%rowtype;
  team      text[];
  pet_power int;
  hours     numeric;
  gained    numeric;
  total     numeric;
  minted    int;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  select coalesce(array_agg(t), '{}') into team
    from (select t from unnest(prof.team_pets) with ordinality as u(t, n)
           where t = any(prof.owned_pets) order by n limit p_team_max) s;
  select coalesce(sum(coalesce((p_pet_power ->> t)::int, 1)), 0) into pet_power from unnest(team) as t;

  hours  := greatest(0, least(p_max_hours, extract(epoch from (now() - prof.mine_collected_at)) / 3600));
  gained := round(hours * (p_base_per_hour + greatest(1, pet_power) * p_per_power_per_hour), 2);
  total  := prof.mine_points + gained;
  minted := floor(total / p_points_per_prism);

  update profiles
     set mine_points       = total - minted * p_points_per_prism,
         prisms            = prisms + minted,
         mine_collected_at = now()
   where id = p_user
  returning * into prof;

  return jsonb_build_object(
    'hours', round(hours, 2), 'gained', gained, 'minted', minted, 'team', cardinality(team),
    'mine_points', prof.mine_points, 'prisms', prof.prisms, 'collected_at', prof.mine_collected_at
  );
end $$;

revoke all on function public.collect_mining(uuid, numeric, numeric, int, int, jsonb, int) from public, anon, authenticated;
grant execute on function public.collect_mining(uuid, numeric, numeric, int, int, jsonb, int) to service_role;
