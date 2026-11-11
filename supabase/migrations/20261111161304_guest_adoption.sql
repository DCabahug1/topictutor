-- Moving a guest's progress into a real account when they register, sign in
-- with Google, or log in.
--
-- A pending adoption is keyed on the new account's id, not its email. Signing
-- up with an email that already has an account returns a stand-in id that
-- never signs in, so nobody can push a guest's rows into someone else's account.

drop table public.pending_adoptions;

create table public.pending_adoptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  guest_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index pending_adoptions_guest_idx on public.pending_adoptions (guest_id);

alter table public.pending_adoptions enable row level security;
revoke all on public.pending_adoptions from anon, authenticated;

-- Moves everything the guest made to the account. Where both have the same
-- thing (a day's lesson, a finish, settings, the sample copy, an open test),
-- the account's copy wins and the guest's is left to be deleted with the guest.
create function public.adopt_guest(p_from uuid, p_to uuid)
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

  insert into public.learner_settings (user_id, subjects, subjects_prompted, updated_at)
  select p_to, subjects, subjects_prompted, updated_at from public.learner_settings where user_id = p_from
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
