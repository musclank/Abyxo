-- ABYXO Global Leaderboard — run once in Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,18}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.leaderboard (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  best_score integer not null default 0 check (best_score >= 0),
  best_level integer not null default 1 check (best_level between 1 and 100),
  completed_runs integer not null default 0 check (completed_runs >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.score_submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  submitted_at timestamptz not null default now()
);
create index if not exists score_submissions_user_time_idx
  on public.score_submissions(user_id, submitted_at desc);

alter table public.profiles enable row level security;
alter table public.leaderboard enable row level security;
alter table public.score_submissions enable row level security;

drop policy if exists "Public can read player usernames" on public.profiles;
create policy "Public can read player usernames"
  on public.profiles for select to anon, authenticated using (true);

drop policy if exists "Players can update own profile" on public.profiles;
create policy "Players can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Public can read global leaderboard" on public.leaderboard;
create policy "Public can read global leaderboard"
  on public.leaderboard for select to anon, authenticated using (true);

-- Profile creation is tied to the verified Supabase Auth identity.
create or replace function public.create_abyxo_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', 'Abyxonaut'), '[^A-Za-z0-9_]', '', 'g');
  requested_name := left(requested_name, 18);
  if length(requested_name) < 3 then
    requested_name := 'Diver_' || substr(new.id::text, 1, 8);
  end if;
  if exists (select 1 from public.profiles where username = requested_name) then
    requested_name := left(requested_name, 9) || '_' || substr(new.id::text, 1, 8);
  end if;
  insert into public.profiles(id, username) values (new.id, requested_name);
  return new;
end;
$$;

drop trigger if exists on_abyxo_auth_user_created on auth.users;
create trigger on_abyxo_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_abyxo_profile();

-- Scores can only be submitted for the currently authenticated account.
-- Direct table writes are not granted; all updates go through this function.
create or replace function public.submit_abyxo_score(
  p_score integer,
  p_level integer,
  p_completed boolean default false
)
returns public.leaderboard
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_id uuid := auth.uid();
  result_row public.leaderboard;
  last_submission timestamptz;
begin
  if player_id is null then
    raise exception 'Sign in is required to submit a score.';
  end if;
  if p_score is null or p_score < 0 or p_score > 25000
     or p_level is null or p_level < 1 or p_level > 100 then
    raise exception 'Score or level is outside the allowed range.';
  end if;
  if coalesce(p_completed, false) and p_level <> 100 then
    raise exception 'A completed run must reach level 100.';
  end if;

  select submitted_at into last_submission
    from public.score_submissions
    where user_id = player_id
    order by submitted_at desc limit 1;
  if last_submission is not null and last_submission > now() - interval '10 seconds' then
    raise exception 'Score submission rate limit reached. Please wait.';
  end if;

  insert into public.score_submissions(user_id) values (player_id);

  insert into public.leaderboard as current_leaderboard(user_id, best_score, best_level, completed_runs, updated_at)
  values (player_id, p_score, p_level, case when p_completed then 1 else 0 end, now())
  on conflict (user_id) do update set
    best_level = case when excluded.best_score > current_leaderboard.best_score then excluded.best_level else current_leaderboard.best_level end,
    best_score = greatest(current_leaderboard.best_score, excluded.best_score),
    completed_runs = current_leaderboard.completed_runs + excluded.completed_runs,
    updated_at = case when excluded.best_score >= current_leaderboard.best_score then now() else current_leaderboard.updated_at end
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.submit_abyxo_score(integer, integer, boolean) from public;
grant execute on function public.submit_abyxo_score(integer, integer, boolean) to authenticated;
