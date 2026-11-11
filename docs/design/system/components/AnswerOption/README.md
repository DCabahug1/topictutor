# AnswerOption

One choice in a multiple-choice question, used by recall, lesson checks, the placement test and the Mastery Check.

- A question is a radio group. Arrow keys move between options, Space selects. Letters A to D are shown and work as shortcuts on desktop.
- States: default (`rule` border), selected (`ink` border, filled marker, the word "Selected"), correct (`correct-wash`, check glyph, "Correct answer"), incorrect (`incorrect-wash`, cross glyph, "Your answer"), and dimmed (other options after reveal, `ink-muted` text).
- "Not sure" is the fifth option in tests only. It has a dashed border and italic text, uses "?" as its marker, and counts as wrong.
- Recall and checks reveal immediately on selection. Tests reveal only after submit, and answers can change until then.
- After reveal, a one-line explanation follows, led by a mono verdict ("Correct." or "Not quite.") inside a `role="status"` region.
- Text wraps. Options never truncate, so long AI-written options stay readable.
