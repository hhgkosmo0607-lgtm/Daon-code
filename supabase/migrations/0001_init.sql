-- ============================================
-- Daon-code 초기 스키마
-- 콘텐츠 테이블(units/lessons/questions)은 만들지 않는다.
-- 콘텐츠 원본은 앱의 content/*.json 이다. (기획서 10번)
-- ============================================

-- 회원 프로필
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  provider        text,                      -- email / google / kakao / anonymous
  nickname        text,
  total_xp        int  not null default 0,
  level           int  not null default 1,
  streak          int  not null default 0,
  max_streak      int  not null default 0,
  last_study_date date,                      -- Asia/Seoul 기준 날짜
  freeze_count    int  not null default 0,
  daily_goal      int  not null default 20,
  notify_time     time,
  created_at      timestamptz not null default now()
);

-- 레슨 진도
create table if not exists public.progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  lesson_id  text not null,                  -- '1-1' 형식, 콘텐츠 JSON의 id
  completed  boolean not null default false,
  best_score int,
  attempts   int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- 일별 XP (스트릭 계산 + 주간 통계)
create table if not exists public.daily_xp (
  user_id           uuid not null references auth.users(id) on delete cascade,
  date              date not null,           -- Asia/Seoul 기준
  xp                int  not null default 0,
  goal_bonus_given  boolean not null default false,  -- 하루 목표 보너스 1회 제한
  primary key (user_id, date)
);

-- 오답 노트
create table if not exists public.wrong_answers (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  wrong_count int  not null default 1,
  last_wrong  timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 복습 상태 (라이트너 박스)
create table if not exists public.user_term_review (
  user_id      uuid not null references auth.users(id) on delete cascade,
  term_id      text not null,
  box          int  not null default 1,      -- 1~5
  next_review  date not null,
  review_count int  not null default 0,
  primary key (user_id, term_id)
);

-- ============================================
-- RLS — Edge Function만 쓰기 가능하게 막는다
--
-- Edge Function은 service_role 키로 접근하며, service_role은
-- RLS를 우회하므로 별도 정책이 필요 없다.
-- 아래는 일반 클라이언트(anon/authenticated) 권한에 대한 정책이다.
-- ============================================

alter table public.profiles          enable row level security;
alter table public.progress          enable row level security;
alter table public.daily_xp          enable row level security;
alter table public.wrong_answers     enable row level security;
alter table public.user_term_review  enable row level security;

-- 읽기: 본인 행만
create policy "read own profile"   on public.profiles
  for select using (auth.uid() = id);
create policy "read own progress"  on public.progress
  for select using (auth.uid() = user_id);
create policy "read own daily_xp"  on public.daily_xp
  for select using (auth.uid() = user_id);
create policy "read own wrong"     on public.wrong_answers
  for select using (auth.uid() = user_id);
create policy "read own review"    on public.user_term_review
  for select using (auth.uid() = user_id);

-- 쓰기: progress / daily_xp 는 클라이언트가 직접 못 쓴다.
-- (INSERT/UPDATE 정책을 아예 만들지 않으면 기본 거부된다)

-- profiles 중 설정성 컬럼만 본인이 수정 가능.
-- xp/streak 관련 컬럼은 트리거로 변경을 차단한다.
create policy "update own profile settings" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 주의: 트리거 함수는 다른 트리거 함수를 일반 호출할 수 없다(NEW/OLD가 전달되지 않음).
-- 그래서 role 확인과 컬럼 차단을 한 함수 안에서 처리한다.
create or replace function public.guard_profile_xp_columns()
returns trigger language plpgsql as $$
begin
  -- Edge Function은 service_role로 접근하므로 그대로 통과시킨다
  if coalesce(
       current_setting('request.jwt.claims', true)::json->>'role',
       current_user
     ) = 'service_role' then
    return new;
  end if;

  if new.total_xp        is distinct from old.total_xp
     or new.level        is distinct from old.level
     or new.streak       is distinct from old.streak
     or new.max_streak   is distinct from old.max_streak
     or new.last_study_date is distinct from old.last_study_date
     or new.freeze_count is distinct from old.freeze_count then
    raise exception 'xp/streak 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;

  return new;
end $$;

drop trigger if exists guard_profile_xp on public.profiles;
create trigger guard_profile_xp
  before update on public.profiles
  for each row execute function public.guard_profile_xp_columns();

-- 복습 상태와 오답노트는 본인이 직접 갱신해도 무방 (게임 밸런스와 무관)
create policy "upsert own review" on public.user_term_review
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "upsert own wrong"  on public.wrong_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, provider)
  values (new.id, coalesce(new.raw_app_meta_data->>'provider', 'email'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
