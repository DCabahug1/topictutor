# SessionProgress

The masthead-style step rail at the top of the daily session: Recall, Lesson, Check, Finish.

- Sits under the double rule, full width of the reading column.
- Done steps show a check glyph and a hidden ", done". The current step is ink, weight 500, with a 3px `accent` underline and `aria-current="step"`. Upcoming steps are `ink-muted`.
- When the learner has no history, Recall is removed rather than shown as skipped, and the steps renumber.
- Steps are not links. Going back is not part of the session; the close button leaves it.
