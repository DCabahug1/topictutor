-- Learners can name up to five subjects of their own, each with its own place
-- in the daily rotation, toggled on and off like the fixed subjects.
--
-- custom_subjects holds [{ "name": "Astronomy", "on": true }, ...] in the
-- learner's order. Lessons for each are shared by name exactly as a named
-- Other was (daily_lessons.custom_key), so nothing changes there.
--
-- Additive on purpose: the single other_subject column and an 'Other' entry in
-- subjects are left as they are, so a build that still reads them keeps
-- working. New builds ignore both. Drop other_subject in a later migration.

alter table public.learner_settings
  add column custom_subjects jsonb not null default '[]'::jsonb,
  add constraint learner_settings_custom_subjects_check
    check (jsonb_typeof(custom_subjects) = 'array' and jsonb_array_length(custom_subjects) <= 5);

-- A named Other becomes the first custom subject, on if Other was picked.
update public.learner_settings
set custom_subjects = jsonb_build_array(jsonb_build_object('name', other_subject, 'on', 'Other' = any (subjects)))
where other_subject is not null;

comment on column public.learner_settings.other_subject is
  'Deprecated: replaced by custom_subjects. Kept until no running build reads it.';

-- Guest adoption carries the custom subjects over with the rest of the settings.
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

  insert into public.learner_settings (user_id, subjects, other_subject, custom_subjects, subjects_prompted, updated_at)
  select p_to, subjects, other_subject, custom_subjects, subjects_prompted, updated_at from public.learner_settings where user_id = p_from
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
