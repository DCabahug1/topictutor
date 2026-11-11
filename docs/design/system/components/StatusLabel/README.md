# StatusLabel

Series and lesson status as a glyph plus a mono word, and the six-cell percent-complete meter.

- Not started: empty ring, `ink-muted`. In progress: half-filled ring, `ink`. Completed and Lesson done: check glyph, `correct`. Shape and word carry the meaning; colour only reinforces it.
- Percent complete has six cells: five lessons plus the Mastery Check, which has a dashed outline until passed. All lessons without a pass is 83%.
- The meter is `role="img"` with an aria-label that spells out the state, and always shows the percentage as text.
