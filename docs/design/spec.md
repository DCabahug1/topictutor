# TopicTutor: developer spec (Almanac design)

This file is the source of truth. It was updated on Nov 10 for the C1 hierarchy pass, so it is newer than the online copy at https://claude.ai/artifact/NQNY7CFHs9D9HAkZKoSdPw.

## Tokens and theming

Tokens are in `tokens.css`. Components use roles, never hex values. Dark mode swaps variables on `<html data-theme>`. Dark uses the **graphite** tone by default. Black, slate and umber are optional via `data-tone` (see `tokens.css`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | #F1F2EE | #1E2124 | Page background |
| `--paper-raised` | #FFFFFF | #272B2F | Cards, options, inputs |
| `--paper-sunk` | #E2E4DE | #31363B | Wells, skeleton lines while writing |
| `--ink` | #16181A | #E6E7E3 | Text, control borders, primary fill |
| `--ink-soft` | #3B3F43 | #C4C7C3 | Lead paragraphs, secondary body copy |
| `--ink-muted` | #565B60 | #A0A5AA | Metadata, captions, upcoming steps |
| `--on-ink` | #F1F2EE | #1E2124 | Text on an ink fill |
| `--rule` | #C9CCC6 | #3E444A | Decorative hairlines only, never a control border |
| `--accent` | #C23A12 | #FF7A50 | Kickers, current step, streak, focus. One or two marks per screen. |
| `--correct` / `--correct-wash` | #1F4E8C / #E3EAF4 | #8DB4F0 / #24324A | Correct, passed, completed |
| `--incorrect` / `--incorrect-wash` | #8F3F00 / #F6E7D8 | #F0A35E / #3A2C1E | Wrong, failed, errors |
| `--focus` | accent | accent | 2px ring, 2px offset |

Theme switch:

1. A blocking inline script in `<head>` reads `localStorage.theme`. If nothing is set, it follows `prefers-color-scheme`. It sets `data-theme` before paint, so there is no flash.
2. The theme button (on every page, in the masthead or the session bar) toggles light and dark, stores the choice, and updates its `aria-label` ("Switch to dark theme").
3. While nothing is stored, a `matchMedia` listener follows system changes live.

Spacing is a 4px scale (`--space-1` 4px to `--space-8` 72px). Radius is 0 everywhere, except 2px on answer markers and full round on avatars and day dots. There are no shadows.

## Hierarchy rules (C1 pass)

The first version had too much text and too many elements that looked alike, so learners had to search for what to do next. Every screen now follows these rules. When a reference file and an older note disagree, the reference file wins.

1. **One primary button per screen, and it is the next step.** Filled ink, 58px tall, mono label with an arrow, full width on phones. It sits directly under the lead block. Nothing else on the screen uses the ink fill.
2. **Everything else is a quiet link:** italic serif, `--ink-soft`, underlined, usually starting with "or" ("or stop for today"). Outlined buttons are only used for "Continue with Google" and inside dialogs.
3. **Every screen opens with a lead block:** one mono eyebrow (accent), one large serif heading (`.t-lead-h1` or `.t-lead-h1-sm`), at most one supporting sentence (`.t-lead`), then the button. Keep the heading the biggest thing on the screen, except a hero numeral where the number is the point (streak, score).
4. **Supporting information is smaller and set aside.** Streak, stats and metadata sit to the right on desktop or after a long gap (`--section-gap`). Numerals there are ink, not accent. Accent numerals are for the finish moment only.
5. **Selection never looks like the primary button.** Subject tiles and toggles: selected is `--paper-raised` with a 4px accent bar and a "✓" mark, unselected is transparent with muted text. Filters are text tabs with a 2px accent underline. Answer options: selected is a 2px ink border on raised.
6. **Lists are ruled rows:** a title, an optional italic line, and a status glyph plus word only where it changes a decision. No descriptions or "updated" dates in lists.
7. **Sessions and tests use a step meter,** a row of thin bars (done ink, current accent, upcoming rule) with one mono line under it ("Lesson · step 2 of 4"). The placement test no longer has a question list beside it.
8. **Charts are quiet.** Bars use `--ink-muted` so the primary button stays the darkest element.
9. **Space does the grouping.** Use `--lead-top` above the lead and `--section-gap` between groups instead of extra rules, boxes or labels.

## Type and layout

- **Newsreader** (Google, opsz 6 to 72, weights 400/500/600, plus italic) for everything you read. **IBM Plex Mono** (400/500) for labels, buttons, numbers and dates. Load both with `next/font/google` and expose them as `--font-serif` and `--font-mono`.
- Text styles are the `.t-*` classes in `tokens.css`. Phone sizes: titles 36 to 42px, lesson text 18.5px / 1.55. Desktop lesson text: 20 to 21px / 1.6.
- Labels are mono, 12px, 0.08em tracking, uppercase. Buttons are mono, 15px, sentence case.
- Breakpoints: phone below 768px, tablet 768 to 1119px, desktop from 1120px. Everything works at 320px.
- Gutters: 24px on phone, 72px on desktop (`--gutter`). Content max width 1200px. Reading column (lessons, checks, tests) 720px max, centred.
- Vertical rhythm: `--lead-top` (112px desktop, 56px phone) from the masthead to the lead block, `--section-gap` (152px, 88px) between groups.
- Two-column pages use `flex-wrap` (main column basis 520 to 560px, side column 320 to 380px), so they stack without media queries.
- On phones, session actions sit in a footer pinned to the bottom of the viewport. Signed-in pages get a three-tab bar (Today, Library, Stats); the current tab has a 3px accent top border.
- The masthead closes with a double rule: 3px ink, 3px gap, 1px ink.
- Touch targets are 44px minimum. The primary button is 58px tall.

## Components

| Component | Props | States | Notes |
| --- | --- | --- | --- |
| `Button` | `variant` primary, outline, quiet · `busy` · `disabled` · `href` | default, hover (primary turns accent), focus, busy, disabled | One primary per screen. `quiet` is the italic "or …" link. `outline` is only for Google sign-in and a section's own action. In a confirm dialog the safe choice is the filled button and the delete is `danger`, a red outline. Disabled is a dashed muted outline and says why ("Pick an answer"). |
| `LeadBlock` | `eyebrow` · `title` · `size` lg or sm · `line` · `primary` · `quiet[]` · `numeral` | | The opening of every screen (rule 3). `numeral` adds a hero number above the title (streak, score). |
| `AnswerOption` | `letter` · `text` · `selected` · `result` none, correct, incorrect, dimmed · `unsure` · `onSelect` | default, selected, correct, incorrect, dimmed, Not sure | `role="radio"` inside a `radiogroup`. Tags "Selected", "Your answer", "Correct answer" are required text. Not sure: dashed border, italic, "?" marker. |
| `Question` | `prompt` · `options` · `mode` instant or deferred · `explanation` | unanswered, answered, revealed | `instant` for recall and checks (reveal on select), `deferred` for tests (reveal after submit). Explanation leads with a mono verdict: "Correct." or "Not quite." |
| `StepMeter` | `steps` · `current` · `label` | done, current, upcoming | Thin bars plus one mono line. Used in the daily session, placement test and Mastery Check. Replaces the old step rail and the test question list. |
| `SessionProgress` | (now `StepMeter`) | | Recall disappears and steps renumber when there's no history. |
| `LessonBody` | `paragraphs` (3) · `streaming` · `dropCap` | writing, written | Reserves three paragraph slots as `--paper-sunk` lines while writing. Daily lessons use a drop cap. |
| `AskBox` | `lessonId` · `onAsk` · `onExplainDifferently` · `stream` | empty, answering, answered, failed | Not persisted. Unmounting clears it. The italic note says so. |
| `TextField` | `label` · `type` · `error` · `help` · `maxLength` · `readOnly` · `revealable` | default, error, read-only, counted | Errors appear in context after submit, linked with `aria-describedby`. Password has a Show/Hide toggle with `aria-pressed`. |
| `StatusLabel` | `status` notStarted, inProgress, completed, done | | Ring, half ring or check, plus a word. |
| `ProgressMeter` | `lessonsDone` · `size` | | Five small segments plus "2 of 5 done" as text. The Mastery Check is its own row in the lesson list, not a sixth cell. |
| `StreakMark` | `count` · `days` · `todayDone` · `longest` | active, done today, zero | A raised card set aside from the lead: Newsreader numeral in ink, "day streak", a 4 x 7 grid of the last 28 days (`FourWeekGrid`) and one italic note. Current run ink, older done days ink-muted, missed days a rule outline. Today undone is a dashed square with "Today still counts until midnight." No accent on the card. "Longest so far" only when it beats the current run. Zero is muted, never a warning. The Finish screen shows `FourWeekGrid` large with `celebrate`, where today's square fills in accent. |
| `Masthead` | `user` · `guestProgress` · `current` | signed out, guest with progress, signed in | Account button shows photo or initial; menu shows name (or email), email, Profile, Sign out. |
| `SessionBar` | `onLeave` · `leaveLabel` | | Replaces the masthead in sessions and tests: close, name, theme. |
| `Notice` | `tone` error or info · `title` · `body` · `kept` · `primary` · `secondary` | | Every failure has a retry and a way to leave. `kept` names what was saved. |
| `ConfirmDialog` | `title` · `body` · `confirmLabel` · `onConfirm` · `onCancel` | | `role="alertdialog"`, focus trapped, starts on "Keep it", Escape cancels. |

Also: `SeriesRow`, `LessonRow` (the "why this is in your series" line shows only on the next lesson), `SubjectToggle` (`aria-pressed`, selected per rule 5), `FilterTabs` (underlined text tabs with counts), `StatBars` (muted bars), `ThemeButton`, `BottomTabs`.

The component previews in `system/components/` predate the hierarchy pass. Where they differ from this table or the reference screens, follow this file.

Live component previews (HTML, use the same CSS variables) are in `system/components/*/preview.html`, with notes in each `README.md`.

## Routes and states

| Route | Access | States |
| --- | --- | --- |
| `/` | Public | guest, signed in (main action goes to Today) |
| `/today/lesson` | Public | recall (skipped with no history), lesson writing, lesson written, check, finish; guest and returning; failed to write |
| `/welcome/subjects` | Guest or signed in | shown after the first lesson only; none picked, some picked |
| `/welcome/account` | Guest | offer after the finish |
| `/today` | Signed in | established, not started, done, no series, new user |
| `/library` | Signed in | full, loading, nothing yet, no results, delete confirm |
| `/series/new` | Guest or signed in | empty, filled in from Go Deeper or a suggestion; guest used their one series; daily guest limit |
| `/series/new/placement` | Guest or signed in | writing, taking, submitted; failed to write |
| `/series/new/results` | Guest or signed in | results with outline writing, outline ready; outline failed |
| `/series/[id]` | Owner, or public for the sample | not started, in progress, all lessons done (83%), completed; not found; failed to load |
| `/series/[id]/[n]` | Owner or sample | writing (first open), ready, check answered, last lesson; failed to write; not found |
| `/series/[id]/mastery` | Owner | not open yet, writing, taking, passed, not passed; failed to write |
| `/stats` | Signed in | full history, brand new; Profile: photo preview, saving, saved, save failed |
| `/login`, `/register`, `/reset` | Public, signed-in users go to `/today` | log in, log in error, register, register errors, check your email, request reset, reset sent, set new password, reset done, link failed or expired |

Rules:

- Percent complete = (lessons with their check answered, plus 1 if the Mastery Check is passed) / 6. All five lessons without a pass is 83%.
- Streak = consecutive days, in the learner's timezone, with any lesson finished. Not having finished one yet today never breaks it. Finishing a past daily lesson counts.
- A lesson is finished once its check is answered right. A wrong pick is shown with the right answer, then the check can be asked again, rephrased with new specifics and the right answer in a new place.
- The Mastery Check opens when all five lesson checks are answered. Passing is 4 of 5. A retake leans toward missed questions and wrong lesson checks.
- Placement tests and Mastery Checks save answers on every change. A refresh restores the test and answers. "Not sure" is stored as its own value and scored as wrong.
- Outline writing starts automatically on submit.
- Guests can go deeper once. There's also a daily limit across all guests. Both point to the sample series.
- A guest who creates an account keeps their progress.
- No XP, badges, daily goals, email reminders, payments or subscriptions anywhere.

## Motion and streaming

| Moment | Duration | Easing | Reduced motion |
| --- | --- | --- | --- |
| Hover, press, selection, focus | 120ms | ease-out | color only |
| Session step change (fade out, then fade in rising 8px) | 240ms | `--ease-enter` | instant |
| Answer feedback reveal | 240ms | `--ease-enter` | instant |
| Finish: old streak number slides up and out, new one slides in, double rule draws left to right | 640ms | `--ease-enter` | new number shown directly |
| Mastery Check pass: double rule draws across | 640ms | `--ease-enter` | shown directly |

Streaming text (a lesson's first open, tutor answers, outlines):

1. Before the first token, show the reserved skeleton lines so nothing jumps.
2. Append words as they arrive, followed by a 7 x 17px accent block caret. No blinking.
3. While writing, the main action is disabled and busy ("Writing the lesson"). The ask box and check stay hidden until the text is done.
4. `aria-busy="true"` while writing. Announce once when done, never word by word.
5. With reduced motion, reveal a sentence at a time with no caret.
6. The next series lesson is written ahead of time, so the next button can say "Lesson 4 is ready" and open instantly.

## Voice

- Plain, warm, a little dry. Short sentences. Sentence case, except mono labels (uppercase).
- Talk about learning, not the app. No error codes. Say what was kept and what to do.
- No exclamation marks except one on the finish screen. No em dashes in product copy.
- Use the copy in the reference files as written.

## Accessibility checklist

- [ ] All text 4.5:1 (measured: `--ink-muted` 6.1:1 light, 6.5:1 dark graphite; `--accent` 4.8:1 light, 6.3:1 dark graphite).
- [ ] Real `button`, `a`, `input` everywhere, with visible labels. Icon-only buttons have an `aria-label`.
- [ ] Visible focus on everything, never removed.
- [ ] Questions are radio groups: arrows move, Space selects. Desktop shortcuts: A to D, N for Not sure.
- [ ] Status never relies on color alone: glyph plus word.
- [ ] The step meter is `aria-hidden`; its text line ("Lesson · step 2 of 4") carries the progress.
- [ ] Feedback in `role="status"`, errors in `role="alert"`.
- [ ] Meters and charts are `role="img"` with an `aria-label` that spells out the value.
- [ ] Delete dialog traps focus, starts on "Keep it", Escape cancels.
- [ ] `prefers-reduced-motion` honored.
- [ ] Works at 320px and 200% zoom without horizontal scrolling.

## Open decisions (built as drawn unless told otherwise)

| Decision | As drawn | Alternative |
| --- | --- | --- |
| After the outline is written | Learner taps "Open your series" | Go to the overview automatically |
| Guest taps "Stop for today" on the finish | Account offer first | Straight to "done for today" |
| Subject picker | Offers "Skip for now" | Require at least one |
| Recall | Must be answered before the lesson | Allow skipping |
| Signed-in phone navigation | Bottom tab bar | Masthead links only |
| Library opening | Leads with the most recent in-progress series and its Continue button | Lead with "Start a new series" |
| Stats opening | Leads with the streak and "Start today's lesson" (hidden once today is done) | No button on Stats |
| Today when done | The primary becomes "Continue your series" | No primary once done |
| Email links | Work for one hour, once | Whatever the auth provider uses |
