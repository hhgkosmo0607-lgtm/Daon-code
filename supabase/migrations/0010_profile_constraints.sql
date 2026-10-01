-- 0010: profiles 설정 컬럼 범위 제한 + handle_new_user search_path 고정
--
-- daily_goal은 앱이 온보딩에서 직접 UPDATE하는 컬럼이라(guard 트리거 대상 아님) 아무 값이나 넣을 수 있었다.
-- 0이나 음수로 바꾸면 매일 첫 레슨마다 하루 목표 보너스(XP 20·코인 10)를 받는다.
-- 앱의 선택지는 10/20/30이고, 나중에 선택지를 늘릴 여지를 두고 10~100으로 막는다.
--
-- handle_new_user는 security definer인데 search_path가 고정돼 있지 않았다.
-- 함수 안에서 이름을 public.으로 다 적었지만, Supabase 권장대로 빈 search_path로 고정한다.
--
-- 여러 번 실행해도 안전하다.

update public.profiles
set daily_goal = least(greatest(daily_goal, 10), 100)
where daily_goal < 10 or daily_goal > 100;

alter table public.profiles drop constraint if exists profiles_daily_goal_range;
alter table public.profiles
  add constraint profiles_daily_goal_range check (daily_goal between 10 and 100);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, provider)
  values (new.id, coalesce(new.raw_app_meta_data->>'provider', 'email'))
  on conflict (id) do nothing;
  return new;
end $$;
