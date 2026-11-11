-- The daily check now needs 80% right to finish the lesson (every question, with
-- one or two). A wrong pick stays in check_answers until the question is asked
-- again; the question then comes back with its options moved, and this learner's
-- version of the check is kept here. Null means the lesson's own questions.
-- Days finished before this change stay finished.
alter table public.daily_progress add column check_questions jsonb;
