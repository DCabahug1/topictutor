# TopicTutor: hierarchy pass, build brief for Claude Code

This is version 2 of the design handoff (Nov 10). The look stays **Almanac**. What changes is **layout and hierarchy**. The first version had too much text and too many elements that looked alike, so learners had to search for what to do next. Every screen now has one obvious next step.

If the repo already has the Almanac redesign (for example on `refactor/ui-ux-overhaul`), treat this as a revision of those screens. If it doesn't, build from these files directly. The product behavior, data layer, auth, AI calls and database stay as they are either way.

## What's in this folder

| Path | What it is | When to read it |
| --- | --- | --- |
| `HANDOFF.md` | This brief: rules, phases, definition of done | First |
| `design/spec.md` | **Hierarchy rules**, tokens, layout, components, routes and states, motion, accessibility, open decisions | Before each phase |
| `design/screenshots/*.png` | Every screen and state, rendered with the real fonts. `desk-*` at 1440px, `phone-*` at 390px, `proto-*` are the prototype steps in order | Look at these before building a screen |
| `design/tokens.css` | Tokens as CSS variables (light, graphite dark, optional tones), layout rhythm variables, text classes | Phase 1 |
| `design/tokens.json` | The same tokens as data | If you map tokens into Tailwind or TS |
| `design/reference/*.dc.html` | The source of every screen, with exact sizes and copy. Start with `design/reference/README.md` | Whenever you build a screen |
| `design/system/` | The brand book and component previews from version 1. Where they differ from `spec.md`, `spec.md` wins | Background only |

## Ground rules

1. **Git.** Commit locally on the current branch only, with no co-author line. Do not push or open a PR without asking first.
2. **Survey before changing anything.** Read the repo and map each screen in `design/reference/README.md` to the route and component that renders it now.
3. **Follow the hierarchy rules in `design/spec.md`.** In short:
   - One filled ink button per screen. It's the next step, and it sits right under the lead heading.
   - Every other action is a quiet italic "or …" link.
   - Each screen opens with a lead block: eyebrow, big heading, at most one sentence, the button.
   - Supporting info (streak, stats, metadata) is smaller and set aside.
   - Selection never uses the ink fill.
4. **Match the screenshots and reference files.** Rebuild them as clean React components. Never copy the inline styles or the `.dc.html` runtime into the app.
5. **Tokens only.** Colors live as CSS variables in the app's token file (for example `app/almanac.css`) and are used through Tailwind v4 shorthand like `bg-(--paper)`. No raw hex in components, no `rounded-*`, no shadows. Circles for avatars and day dots are the only round shapes.
6. **Both themes, every screen.** Dark is now **graphite** (`#1E2124`), softer than the old black. Add `data-tone` support only if it's cheap. Graphite is the default.
7. **Status is never color alone.** Correct and wrong, pass and fail, and series status always have a glyph and a word.
8. **Copy.** Use the reference copy as written. Sentence case, no em dashes, no error codes, and only one exclamation mark, on the finish screen.
9. **Keep what the product leaves out.** No XP, badges, daily goals, email reminders, payments or subscriptions.
10. **Work in phases.** Commit at the end of each phase with a short summary of what's done and what's missing. If a design call isn't covered, build it as drawn and list it.

## Phase 0: survey (no code changes)

- List the framework, styling approach and token file, and how lessons, tests and tutor answers stream.
- Produce a table: screen in `reference/README.md` → current route and component → what changes in this pass.
- Stop and post the table before Phase 1.

## Phase 1: foundations

- Update the dark palette to graphite (see `design/tokens.css`). Keep light as it is.
- Add the layout rhythm variables: `--gutter`, `--lead-top`, `--section-gap`, `--action-gap`, `--button-h`, `--reading-col`, `--content-max`, with the phone values.
- Add the text styles `.t-lead-h1`, `.t-lead-h1-sm`, `.t-lead`, `.t-section`, `.t-eyebrow`, `.t-quiet-link` (or Tailwind equivalents).
- **Done when:** an empty page shows the masthead in light and graphite with no flash on reload.

## Phase 2: hierarchy components

Build or rework these, per the Components table in `design/spec.md`:

- `LeadBlock`
- `Button` (primary, outline only for Google and dialogs, quiet link)
- `StepMeter`
- `ProgressMeter` (five segments plus text)
- `SubjectToggle` (raised with an accent bar when selected)
- `FilterTabs`
- `StreakMark` (a four-week card in ink; accent only on Finish, where today's square in `FourWeekGrid` fills in accent)
- Ruled `SeriesRow` and `LessonRow`

Show them on a dev-only `/dev/components` page in both themes.

- **Done when:** no selected state uses the ink fill, and every component works by keyboard.

## Phase 3: daily session

Match `proto-session-*` and `desk-lesson`, `desk-check-dark`, `desk-finish`, `desk-subjects`, `desk-account-offer-dark`.

- Replace the labeled step tabs with the step meter. Lesson, check and tests sit in a 720px reading column.
- The tutor is a recessed `--paper-sunk` block after the lesson. The answer shows "↳ From paragraph 3".
- Finish: the streak numeral flips in accent, with the one exclamation, then one button, "Continue your series". "or go deeper on calendars" and "or stop for today" are quiet links.
- **Done when:** each step has exactly one filled button, at 320px, in both themes, with reduced motion on.

## Phase 4: Go Deeper

Match `proto-deeper-*` and the `desk-series-*`, `desk-placement-*`, `desk-mastery-*` screenshots.

- Placement test: one question at a time with the step meter. Remove the side question list. "Not sure" is the last option.
- Results: the score numeral, "Your series starts with what you missed.", and the "Open your series" button with the outline-writing line beside it. Then the missed questions as rows.
- Overview: a lead with the progress meter and "Continue with lesson 3". The lessons are ruled rows. The "why it's here" line shows only on the next lesson. The Mastery Check is its own row. "Delete series" is a small link at the bottom.
- Mastery pass, fail and early: score numeral, one button (start the next series, review lesson 3, or answer the lesson 4 check), then rows.

## Phase 5: Landing, Today, Library, Stats

- **Landing** (`desk-landing`, `phone-landing`) is the final C1 page: hero, today's lesson card, session player, Go Deeper staircase, tutor band, then the dark closing band. The tutor band runs straight into the closing band with no gap. Signed in, the buttons say "Go to today's lesson".
- **Today:** the lesson title is the lead heading, with the greeting in the eyebrow. The streak sits to the right in ink. Series follow after the section gap as rows. When done, the button becomes "Continue your series".
- **Library:** leads with the most recent in-progress series and its Continue button. "or start a new series" is a quiet link. Then "All series" with an underlined search field, text filter tabs and rows, then past daily lessons in two columns.
- **Stats:** leads with the streak numeral and "Start today's lesson". The week chart and by-subject bars are muted. Recall and series completed sit side by side. Profile has the subject tiles in the selected style, one Save button and a small Sign out link.

## Phase 6: account pages and states

Match `phone-auth-*`, `desk-auth-login` and `phone-state-*`. Auth is a single 480px column: eyebrow, heading, optional error banner, an outlined Google button, fields, and one full-width primary. Error states have one primary (usually "Try again") and a quiet way out.

## Phase 7: QA

- Run the accessibility checklist in `design/spec.md`.
- Check every page at 320, 390, 768, 1120 and 1440px, in both themes, with reduced motion on.
- On every screen, confirm there is exactly one filled button and that it's the next step.
- Post a final summary: what's done, any differences from the screenshots and why, and gaps found.

## First message to start with

> Read `HANDOFF.md`, then "Hierarchy rules" in `design/spec.md`, then `design/reference/README.md`. Look through `design/screenshots/`. Do Phase 0 and stop with the mapping table.
