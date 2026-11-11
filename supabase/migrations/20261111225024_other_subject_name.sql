-- "Other" becomes a subject the learner names ("Astronomy", "Chess openings").
--
-- The name is kept per learner in learner_settings.other_subject. Daily lessons
-- for a named Other subject are keyed by a normalized form of the name
-- (custom_key), so everyone who types the same subject on the same day shares
-- one lesson, the same way the fixed subjects are shared. Fixed subjects, and
-- an Other picked before it could be named, keep custom_key = ''.

alter table public.learner_settings
  add column other_subject text
    check (other_subject is null or char_length(other_subject) between 1 and 120);

alter table public.daily_lessons
  add column custom_key text not null default '',
  -- The name as first typed, for display. Null for fixed subjects.
  add column custom_name text,
  add constraint daily_lessons_custom_check check (
    (custom_key = '' and custom_name is null)
    or (
      subject = 'Other'
      and custom_key <> ''
      and char_length(custom_key) <= 120
      and custom_name is not null
      and char_length(custom_name) between 1 and 120
    )
  );

alter table public.daily_lessons drop constraint daily_lessons_lesson_date_subject_key;
alter table public.daily_lessons
  add constraint daily_lessons_lesson_date_subject_custom_key unique (lesson_date, subject, custom_key);

-- The recent-titles lookup reads one subject (and custom key) back in time.
create index daily_lessons_subject_recent_idx on public.daily_lessons (subject, custom_key, lesson_date desc);

-- Guest adoption carries the Other name over with the rest of the settings.
create or replace function public.adopt_guest(p_from uuid, p_to uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_from is null or p_to is null or p_from = p_to then
    return;
  end if;

  update public.daily_progress g set user_id = p_to
  where g.user_id = p_from
    and not exists (select 1 from public.daily_progress a where a.user_id = p_to and a.lesson_date = g.lesson_date);

  update public.lesson_finishes g set user_id = p_to
  where g.user_id = p_from
    and not exists (select 1 from public.lesson_finishes a where a.user_id = p_to and a.kind = g.kind and a.ref = g.ref);

  insert into public.learner_settings (user_id, subjects, other_subject, subjects_prompted, updated_at)
  select p_to, subjects, other_subject, subjects_prompted, updated_at from public.learner_settings where user_id = p_from
  on conflict (user_id) do nothing;

  update public.series g set user_id = p_to
  where g.user_id = p_from
    and (not g.is_sample or not exists (select 1 from public.series a where a.user_id = p_to and a.is_sample));

  update public.placements g set user_id = p_to
  where g.user_id = p_from
    and (g.series_id is not null or not exists (
      select 1 from public.placements a where a.user_id = p_to and a.series_id is null
    ));

  delete from public.pending_adoptions where guest_id = p_from;
end;
$$;

revoke execute on function public.adopt_guest(uuid, uuid) from public, anon, authenticated;
grant execute on function public.adopt_guest(uuid, uuid) to service_role;
