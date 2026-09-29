-- ============================================
-- 출석 잔디 + 보유 고양이 (daon-content/Daon-code_아이디어.md 2-A)
--
-- 잔디(고양이 먹이)는 레슨을 풀지 않아도 그날 처음 앱에 들어오면 준다.
-- 0005에서 레슨 제출 때 주던 방식을 이걸로 바꾼다 (apply_lesson_result의 p_grass는
-- 이제 아무도 넘기지 않아 기본값 0으로만 쓰인다).
-- 날짜는 Asia/Seoul 기준이고, check-in Edge Function이 계산해서 넘긴다.
--
-- 보유 고양이: 처음엔 치즈(orange)만. 나머지 7색은 상점에서 코인으로 산다 (최대 8마리).
-- ============================================

alter table public.profiles
  add column if not exists last_checkin_date date,
  add column if not exists owned_cats        text[] not null default array['orange'];

-- 출석 날짜·보유 고양이도 서버만 바꿀 수 있다 (0005의 가드에 last_checkin_date, owned_cats 추가)
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
     or new.pet_working_until is distinct from old.pet_working_until
     or new.last_checkin_date is distinct from old.last_checkin_date
     or new.owned_cats   is distinct from old.owned_cats then
    raise exception 'xp/streak/coin/펫 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;



-- 하루 한 번만: 오늘 이미 받았으면 아무것도 안 하고 granted=0
create or replace function public.check_in(p_user uuid, p_today date, p_grass int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('error', 'profile_not_found');
  end if;

  if prof.last_checkin_date = p_today then
    return jsonb_build_object('granted', 0, 'grass', prof.grass);
  end if;

  update profiles
     set grass             = grass + p_grass,
         last_checkin_date = p_today
   where id = p_user
  returning * into prof;

  return jsonb_build_object('granted', p_grass, 'grass', prof.grass);
end $$;

revoke all on function public.check_in(uuid, date, int) from public, anon, authenticated;
grant execute on function public.check_in(uuid, date, int) to service_role;

-- ---------- 상점: 고양이 구매 ----------
-- 가격과 고양이 목록은 features/shop/domain/shopItems.ts, features/pet/domain/catSheet.ts가 정하고
-- purchase Edge Function이 확인해서 넘긴다. 잔액 확인 → 차감 → 지급을 행을 잠근 채 한 번에 한다.
create or replace function public.purchase_cat(p_user uuid, p_cat text, p_price int)
returns jsonb
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
  if prof.coins < p_price then
    return jsonb_build_object('error', 'not_enough_coins');
  end if;

  update profiles
     set coins      = coins - p_price,
         owned_cats = owned_cats || p_cat
   where id = p_user
  returning * into prof;

  return jsonb_build_object('coins', prof.coins, 'owned_cats', prof.owned_cats);
end $$;

revoke all on function public.purchase_cat(uuid, text, int) from public, anon, authenticated;
grant execute on function public.purchase_cat(uuid, text, int) to service_role;
