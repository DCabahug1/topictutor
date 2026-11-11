# Glossary

The words the Almanac code and docs use for the product. When a module is named after one of these, it means exactly this.

**Daily lesson.** The three-minute lesson for today. It ends with the **daily check**: one or two quick questions. The lesson is done, and the day counts toward the streak, only at 80% right, which with one or two questions means all of them. A miss is shown with the right answer, then asked again in the same words with the right answer moved. Owned by the daily part of `lib/almanac/lesson-check.ts`. Days finished before this rule stay finished.

**Series.** Five lessons on one topic, written for one learner after a placement test.

**Lesson check.** The one question at the end of a series lesson. Only a right pick finishes the lesson. Owned by `lib/almanac/lesson-check.ts`.

- **Unanswered.** No pick yet on the current question.
- **Missed.** A wrong pick on the current question. It is shown with the right answer, and the lesson stays unfinished.
- **Asked again.** After a miss, the check comes back: rephrased with new specifics, or, when it can't be rephrased, the same words with the right answer moved. Asking again clears the miss.
- **Passed.** A right pick. The lesson is finished. Rows answered before retries existed may hold a wrong pick here, and they stay finished.
- **Was missed.** Any pick on this lesson was ever wrong. Never cleared. The Mastery Check leans on these lessons.

**Mastery Check.** Five questions across a series, open once every lesson check is passed. Four right passes it.

**Recall.** One question from an earlier daily lesson, asked before today's.
