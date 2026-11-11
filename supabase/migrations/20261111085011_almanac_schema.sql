-- The Almanac data layer: daily lessons, series, placement tests, Mastery
-- Checks, streaks, and the bookkeeping that keeps generation and costs in check.
--
-- Every table here is server-only. The app reads and writes them from route
-- handlers with the service role, after checking the caller's verified claims,
-- so neither anon nor authenticated gets any privilege, and RLS is on with no
-- policies as a second lock. A learner's JWT can't read or forge a streak.

-- ---- shared daily lessons ----

create table public.daily_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_date date not null,
  subject text not null check (subject in (
    'Math', 'Science', 'Technology', 'History', 'Literature', 'Business',
    'Finance', 'Arts', 'Language', 'Health and Wellness', 'Other'
  )),
  title text not null,
  minutes smallint not null default 3,
  -- What the prose must cover, so the check questions match the text.
  key_points jsonb not null,
  -- ChoiceQuestion[]: one or two.
  check_questions jsonb not null,
  deeper_topic text not null,
  ask_hint text not null,
  -- Null until written on first open. Three paragraphs.
  paragraphs text[],
  created_at timestamptz not null default now(),
  written_at timestamptz,
  unique (lesson_date, subject)
);

-- ---- one learner's day ----

create table public.daily_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_date date not null,
  lesson_id uuid not null references public.daily_lessons (id) on delete cascade,
  -- The earlier lesson the recall question came from, and the answer given.
  recall_lesson_id uuid references public.daily_lessons (id) on delete set null,
  recall_answer smallint,
  recall_correct boolean,
  check_answers smallint[] not null default '{}',
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_date)
);

create index daily_progress_lesson_idx on public.daily_progress (lesson_id);

-- Every finished lesson, daily or series. Streaks and stats are counted from here.
create table public.lesson_finishes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The learner's own calendar date when it was finished.
  local_date date not null,
  kind text not null check (kind in ('daily', 'series')),
  subject text not null,
  -- The daily lesson id, or "<series id>:<number>".
  ref text not null,
  finished_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);

create index lesson_finishes_user_date_idx on public.lesson_finishes (user_id, local_date);

create table public.learner_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subjects text[] not null default '{}',
  subjects_prompted boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---- series ----

create table public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- A learner's own copy of the public sample, made on their first answer.
  is_sample boolean not null default false,
  title text not null,
  category text not null,
  description text not null,
  focus_line text,
  placement_score smallint,
  mastery_passed boolean not null default false,
  mastery_best smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index series_user_updated_idx on public.series (user_id, updated_at desc);
create unique index series_one_sample_idx on public.series (user_id) where is_sample;

create table public.series_lessons (
  series_id uuid not null references public.series (id) on delete cascade,
  number smallint not null check (number between 1 and 5),
  title text not null,
  description text not null,
  why text not null,
  focus boolean not null default false,
  key_points jsonb not null,
  check_question jsonb not null,
  ask_hint text not null,
  -- Null until written on first open.
  paragraphs text[],
  check_answer smallint,
  answered_at timestamptz,
  primary key (series_id, number)
);

-- ---- placement tests ----

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null check (char_length(topic) between 1 and 120),
  focus text not null default '' check (char_length(focus) <= 300),
  -- ChoiceQuestion[]: five, null while being written.
  questions jsonb,
  -- (number | "unsure" | null)[]
  answers jsonb not null default '[null, null, null, null, null]',
  submitted_at timestamptz,
  score smallint,
  focus_line text,
  -- OutlineRow[] written so far.
  outline jsonb not null default '[]',
  -- Set once the outline is written and the series exists.
  series_id uuid references public.series (id) on delete set null,
  created_at timestamptz not null default now()
);

-- One test in progress at a time.
create unique index placements_one_open_idx on public.placements (user_id) where series_id is null;
create index placements_series_idx on public.placements (series_id);

-- ---- Mastery Checks ----

create table public.mastery (
  series_id uuid primary key references public.series (id) on delete cascade,
  -- ChoiceQuestion[] with lessonNumber, null until written.
  questions jsonb,
  answers jsonb not null default '[null, null, null, null, null]',
  submitted boolean not null default false,
  last_score smallint,
  best smallint,
  attempts integer not null default 0,
  ever_passed boolean not null default false,
  -- After a failed attempt: [{ number, title }].
  review jsonb not null default '[]',
  -- After a pass: [{ title, why }].
  suggestions jsonb not null default '[]',
  -- The retake, written ahead after a failed attempt so it opens at once.
  next_questions jsonb,
  updated_at timestamptz not null default now()
);

-- ---- bookkeeping ----

-- One writer at a time for anything generated: a daily lesson, a series lesson, an outline.
create table public.generation_claims (
  key text primary key,
  token uuid not null,
  expires_at timestamptz not null
);

-- Daily caps: guest series across all guests, tutor questions per learner, and so on.
create table public.usage_counters (
  scope text not null,
  day date not null,
  count integer not null default 0,
  primary key (scope, day)
);

-- A guest who registered by email, waiting for the confirmation link so their progress can move over.
create table public.pending_adoptions (
  email text primary key check (email = lower(email)),
  guest_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index pending_adoptions_guest_idx on public.pending_adoptions (guest_id);
create index daily_progress_recall_idx on public.daily_progress (recall_lesson_id);

-- ---- locks ----

alter table public.daily_lessons enable row level security;
alter table public.daily_progress enable row level security;
alter table public.lesson_finishes enable row level security;
alter table public.learner_settings enable row level security;
alter table public.series enable row level security;
alter table public.series_lessons enable row level security;
alter table public.placements enable row level security;
alter table public.mastery enable row level security;
alter table public.generation_claims enable row level security;
alter table public.usage_counters enable row level security;
alter table public.pending_adoptions enable row level security;

revoke all on
  public.daily_lessons, public.daily_progress, public.lesson_finishes, public.learner_settings,
  public.series, public.series_lessons, public.placements, public.mastery,
  public.generation_claims, public.usage_counters, public.pending_adoptions
from anon, authenticated;

-- ---- server-only functions ----

-- Takes the claim on `key` if it is free or its lease ran out. True when this caller holds it.
create function public.claim_generation(p_key text, p_token uuid, p_seconds integer)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with taken as (
    insert into public.generation_claims as c (key, token, expires_at)
    values (p_key, p_token, now() + make_interval(secs => p_seconds))
    on conflict (key) do update
      set token = excluded.token, expires_at = excluded.expires_at
      where c.expires_at < now()
    returning c.token
  )
  select exists (select 1 from taken where token = p_token);
$$;

-- Lets go of a claim, only if this caller still holds it.
create function public.release_generation(p_key text, p_token uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.generation_claims where key = p_key and token = p_token;
$$;

-- Counts one use against a daily cap. False, with nothing counted, once the cap is reached.
create function public.bump_usage(p_scope text, p_day date, p_limit integer)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with bumped as (
    insert into public.usage_counters as u (scope, day, count)
    values (p_scope, p_day, 1)
    on conflict (scope, day) do update
      set count = u.count + 1
      where u.count < p_limit
    returning u.count
  )
  select exists (select 1 from bumped) and p_limit > 0;
$$;

revoke execute on function public.claim_generation(text, uuid, integer) from public, anon, authenticated;
revoke execute on function public.release_generation(text, uuid) from public, anon, authenticated;
revoke execute on function public.bump_usage(text, date, integer) from public, anon, authenticated;
grant execute on function public.claim_generation(text, uuid, integer) to service_role;
grant execute on function public.release_generation(text, uuid) to service_role;
grant execute on function public.bump_usage(text, date, integer) to service_role;
