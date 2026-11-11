-- Hardens the policies on the legacy tables before anonymous sign-ins are
-- turned on. Anonymous guests hold the `authenticated` role, so any policy that
-- only checks the role would let them in.
--
-- Found in the audit (2026-11-11):
--   * profiles: anyone with the public key could read every profile, emails
--     included, and insert any row.
--   * topics: any signed-in user could insert a row for another user.
--   * every UPDATE policy lacked WITH CHECK, so a row could be handed to
--     another user.
--   * anon held full table privileges on all four tables.
--
-- After this migration the legacy product works as before for real accounts,
-- and guests (is_anonymous) can read nothing and write nothing there.

-- The caller is a real account, not an anonymous guest.
-- Inlined in each policy: (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false

-- ---- profiles ----

drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Policy with table joins" on public.profiles;

create policy "Profiles: owner reads" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Profiles: account inserts its own" on public.profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false
  );

create policy "Profiles: owner updates" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---- topics ----

drop policy if exists "Enable delete for users based on user_id" on public.topics;
drop policy if exists "Enable insert for authenticated users only" on public.topics;
drop policy if exists "Enable read access for all users" on public.topics;
drop policy if exists "Policy with table joins" on public.topics;

create policy "Topics: owner reads" on public.topics
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Topics: account inserts its own" on public.topics
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false
  );

create policy "Topics: owner updates" on public.topics
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Topics: owner deletes" on public.topics
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- chapters ----

drop policy if exists "Enable delete for users based on user_id" on public.chapters;
drop policy if exists "Enable insert for users based on user_id" on public.chapters;
drop policy if exists "Enable users to view their own data only" on public.chapters;
drop policy if exists "Policy with table joins" on public.chapters;

create policy "Chapters: owner reads" on public.chapters
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Chapters: account inserts its own" on public.chapters
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false
  );

create policy "Chapters: owner updates" on public.chapters
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chapters: owner deletes" on public.chapters
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- test_results ----

drop policy if exists "Enable insert for users based on user_id" on public.test_results;
drop policy if exists "Enable users to view their own data only" on public.test_results;
drop policy if exists "Policy with table joins" on public.test_results;

create policy "Test results: owner reads" on public.test_results
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Test results: account inserts its own" on public.test_results
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false
  );

create policy "Test results: owner updates" on public.test_results
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---- privileges ----

-- Nothing in the legacy tables is for visitors who aren't signed in.
revoke all on public.profiles, public.topics, public.chapters, public.test_results from anon;
-- Signed-in users never truncate or add triggers.
revoke truncate, trigger, references on public.profiles, public.topics, public.chapters, public.test_results from authenticated;

-- ---- profile photos ----

-- Photos stay in each account's own folder. Guests can't upload.
drop policy if exists "Give users access to own folder 1n0bjoh_0" on storage.objects;
drop policy if exists "Give users access to own folder 1n0bjoh_1" on storage.objects;

create policy "Profile photos: account uploads to its folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile_files'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false
  );

create policy "Profile photos: account replaces its own" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile_files' and (select auth.uid())::text = (storage.foldername(name))[1])
  with check (
    bucket_id = 'profile_files'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and (select coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, false)) = false
  );

-- ---- indexes the advisor asked for ----

create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists topics_user_id_idx on public.topics (user_id);
create index if not exists chapters_user_id_idx on public.chapters (user_id);
create index if not exists chapters_topic_id_idx on public.chapters (topic_id);
create index if not exists test_results_user_id_idx on public.test_results (user_id);
create index if not exists test_results_topic_id_idx on public.test_results (topic_id);
