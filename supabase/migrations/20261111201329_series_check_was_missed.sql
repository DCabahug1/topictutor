-- A wrong lesson check pick is cleared when the question is asked again, and
-- check_answer now holds only right answers, so neither shows a lesson was
-- missed. check_was_missed keeps that, so the Mastery Check can lean on it.
alter table public.series_lessons add column check_was_missed boolean not null default false;

update public.series_lessons set check_was_missed = true where check_missed is not null;
