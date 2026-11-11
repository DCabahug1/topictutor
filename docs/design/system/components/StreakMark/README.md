# StreakMark

The streak as a large vermilion numeral with a seven-day strip of dots.

- Active: `accent` numeral, "days in a row", filled dots for done days. Today, if not yet done, is a dashed ring with the note "Today still counts until midnight." Not having done today does not break the streak.
- Done today: today's dot fills and the note points to tomorrow's category.
- Zero: `ink-muted` numeral and a plain invitation. No guilt copy.
- Days are in the learner's timezone. The strip is `role="img"` with an aria-label listing done days.
- Sizes: 64px on Stats and the finish screen, 30px in Today's header, 15px mono in the nav.
