-- Nightly housekeeping with pg_cron.
--
-- Guests are anonymous users. One who hasn't finished or answered anything for
-- 30 days is deleted, and their rows go with them by cascade. Old counters,
-- expired claims and unclaimed adoptions go too.

create extension if not exists pg_cron;

create function public.almanac_cleanup()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < now() - interval '30 days'
    and not exists (
      select 1 from public.daily_progress p where p.user_id = u.id and p.updated_at > now() - interval '30 days'
    )
    and not exists (
      select 1 from public.lesson_finishes f where f.user_id = u.id and f.finished_at > now() - interval '30 days'
    )
    and not exists (
      select 1 from public.series s where s.user_id = u.id and s.updated_at > now() - interval '30 days'
    );

  delete from public.pending_adoptions where created_at < now() - interval '30 days';
  delete from public.generation_claims where expires_at < now() - interval '1 day';
  delete from public.usage_counters where day < (now() at time zone 'utc')::date - 7;
$$;

revoke execute on function public.almanac_cleanup() from public, anon, authenticated;

select cron.schedule('almanac-cleanup', '30 3 * * *', 'select public.almanac_cleanup()');
