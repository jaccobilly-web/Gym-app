-- Gym Tracker schema. Run this in the Supabase SQL editor (Database → SQL Editor → New query).

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('lower', 'upper', 'full')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id text not null,
  position int not null,
  sets jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists exercise_logs_exercise_idx on public.exercise_logs (user_id, exercise_id, created_at);
create index if not exists exercise_logs_workout_idx on public.exercise_logs (workout_id);

create table if not exists public.custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  region text not null check (region in ('lower', 'core', 'upper')),
  "group" text not null,
  family text not null,
  kind text not null check (kind in ('weighted', 'reps', 'timed')),
  target int not null,
  increment numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_exercises enable row level security;

create policy "own custom exercises" on public.custom_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.workouts enable row level security;
alter table public.exercise_logs enable row level security;

create policy "own workouts" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own logs" on public.exercise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
