-- A lesson check must be answered right to finish the lesson.
-- check_answer is now set only by a right answer; a wrong pick waits here until
-- the question is asked again (rephrased, options reshuffled), which clears it.
-- Lessons answered wrong before this change stay finished.
alter table public.series_lessons add column check_missed smallint;
