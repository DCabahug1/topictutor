-- Series now need an account; guests get today's lesson only. Series and
-- placement tests that guests (anonymous users) started before this change
-- are removed. Lessons and Mastery Checks go with their series by cascade.
-- Guests' lesson_finishes stay, so their streak days don't change.
delete from public.placements where user_id in (select id from auth.users where is_anonymous);
delete from public.series where user_id in (select id from auth.users where is_anonymous);
