-- ============================================
-- 펫 113마리 + 팀 (daon-content/재화_경제.md)
--
--   - 이름: owned_cats → owned_pets, 펫 id는 '종_색' ('orange' → 'cat_orange')
--   - 팀(team_pets): 화면에 나오고 출석 때 채굴하는 펫, 최대 8마리. 가진 펫 전부가 아니라 팀만 캔다.
--   - 가격: 코인 펫은 종별 등급, 프리즘 펫 30 · 전설(드래곤·골렘·미믹) 50 — shopItems.ts(petPrice)
--
-- 배포 순서: 이 마이그레이션 → purchase·check-in·set-team·admin-tools 함수.
-- 그 사이 몇 분은 예전 함수가 없는 컬럼을 불러서 출석·구매가 실패한다 (사용자 거의 없을 때 적용).
-- ============================================

alter table public.profiles rename column owned_cats to owned_pets;

-- 예전 id('orange')를 '종_색'으로 ('cat_orange')
update public.profiles
   set owned_pets = array(
         select case when p like '%\_%' then p else 'cat_' || p end
           from unnest(owned_pets) as p
       );

alter table public.profiles
  alter column owned_pets set default array['cat_orange'];

-- 팀: 가진 펫 앞에서부터 8마리로 시작한다
alter table public.profiles
  add column if not exists team_pets text[] not null default array['cat_orange'];
update public.profiles set team_pets = owned_pets[1:8];

-- 가드: owned_cats 대신 owned_pets, team_pets 추가
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
     or new.owned_pets   is distinct from old.owned_pets
     or new.team_pets    is distinct from old.team_pets
     or new.is_admin     is distinct from old.is_admin then
    raise exception 'xp/streak/coin/prism/펫 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;

-- ---------- 출석: 팀 채굴력만 센다 ----------
-- 채굴력은 features/pet/domain/petCatalog.ts(PET_POWER)가 정하고 check-in이 넘긴다. 표에 없으면 1.
-- 팀 중 실제로 가진 펫만, 앞에서부터 p_team_max마리까지 센다.
drop function if exists public.check_in(uuid, date, int, int, int, jsonb);

create function public.check_in(
  p_user           uuid,
  p_today          date,
  p_mine_base      int,
  p_mine_per_cat   int,
  p_mine_per_prism int,
  p_pet_power      jsonb,
  p_team_max       int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof      profiles%rowtype;
  team      text[];
  pet_power int;
  gain      int;
  gauge     int;
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

  if prof.last_checkin_date = p_today then
    return jsonb_build_object('gain', 0, 'minted', 0, 'team', cardinality(team),
                              'mine_progress', prof.mine_progress, 'prisms', prof.prisms);
  end if;

  gain   := p_mine_base + p_mine_per_cat * greatest(1, pet_power);
  gauge  := prof.mine_progress + gain;
  minted := gauge / p_mine_per_prism;

  update profiles
     set mine_progress     = gauge % p_mine_per_prism,
         prisms            = prisms + minted,
         last_checkin_date = p_today
   where id = p_user
  returning * into prof;

  return jsonb_build_object('gain', gain, 'minted', minted, 'team', cardinality(team),
                            'mine_progress', prof.mine_progress, 'prisms', prof.prisms);
end $$;

revoke all on function public.check_in(uuid, date, int, int, int, jsonb, int) from public, anon, authenticated;
grant execute on function public.check_in(uuid, date, int, int, int, jsonb, int) to service_role;

-- ---------- 펫 구매 ----------
-- 가격은 purchase Edge Function이 shopItems.ts(petPrice)로 계산해서 넘긴다 (가진 수와 상관없는 고정가).
-- 팀에 자리가 있으면 새 펫을 팀에도 넣는다.
drop function if exists public.purchase_cat(uuid, text, text, int, text[]);

create function public.purchase_pet(
  p_user     uuid,
  p_pet      text,
  p_currency text,
  p_price    int,
  p_team_max int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;
  if p_pet = any(prof.owned_pets) then
    return jsonb_build_object('error', 'already_owned');
  end if;

  if p_currency = 'prism' then
    if prof.prisms < p_price then
      return jsonb_build_object('error', 'not_enough_prisms');
    end if;
    update profiles set prisms = prisms - p_price where id = p_user;
  else
    if prof.coins < p_price then
      return jsonb_build_object('error', 'not_enough_coins');
    end if;
    update profiles set coins = coins - p_price where id = p_user;
  end if;

  update profiles
     set owned_pets = owned_pets || p_pet,
         team_pets  = case when cardinality(team_pets) < p_team_max
                           then team_pets || p_pet else team_pets end
   where id = p_user
  returning * into prof;

  return jsonb_build_object('coins', prof.coins, 'prisms', prof.prisms,
                            'owned_pets', prof.owned_pets, 'team_pets', prof.team_pets);
end $$;

revoke all on function public.purchase_pet(uuid, text, text, int, int) from public, anon, authenticated;
grant execute on function public.purchase_pet(uuid, text, text, int, int) to service_role;

-- ---------- 팀 정하기 ----------
-- 가진 펫만, 겹치지 않게, 1~p_team_max마리.
create or replace function public.set_team(p_user uuid, p_team text[], p_team_max int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  if cardinality(p_team) < 1 or cardinality(p_team) > p_team_max
     or cardinality(p_team) <> (select count(distinct t) from unnest(p_team) as t)
     or not (p_team <@ prof.owned_pets) then
    return jsonb_build_object('error', 'invalid_team');
  end if;

  update profiles set team_pets = p_team where id = p_user returning * into prof;
  return jsonb_build_object('team_pets', prof.team_pets);
end $$;

revoke all on function public.set_team(uuid, text[], int) from public, anon, authenticated;
grant execute on function public.set_team(uuid, text[], int) to service_role;
