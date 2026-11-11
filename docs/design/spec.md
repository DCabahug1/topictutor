# TopicTutor: developer spec (Almanac design)

Online copy: https://claude.ai/artifact/NQNY7CFHs9D9HAkZKoSdPw (this file is the offline copy).

## Tokens and theming

Tokens are in `tokens.css`. Components use roles, never hex values. Dark mode swaps variables on `<html data-theme>`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | #F1F2EE | #121416 | Page background |
| `--paper-raised` | #FFFFFF | #1A1D20 | Cards, options, inputs |
| `--paper-sunk` | #E2E4DE | #24282C | Wells, skeleton lines while writing |
| `--ink` | #16181A | #E9EAE6 | Text, control borders, primary fill |
| `--ink-soft` | #3B3F43 | #C9CCC8 | Lead paragraphs, secondary body copy |
| `--ink-muted` | #565B60 | #A3A8AD | Metadata, captions, upcoming steps |
| `--on-ink` | #F1F2EE | #121416 | Text on an ink fill |
| `--rule` | #C9CCC6 | #3A3F44 | Decorative hairlines only, never a control border |
| `--accent` | #C23A12 | #FF7A50 | Kickers, current step, streak, focus. One or two marks per screen. |
| `--correct` / `--correct-wash` | #1F4E8C / #E3EAF4 | #8DB4F0 / #1A2638 | Correct, passed, completed |
| `--incorrect` / `--incorrect-wash` | #8F3F00 / #F6E7D8 | #F0A35E / #2E2216 | Wrong, failed, errors |
| `--focus` | accent | accent | 2px ring, 2px offset |

Theme switch:

1. A blocking inline script in `<head>` reads `localStorage.theme`. If nothing is set, it follows `prefers-color-scheme`. It sets `data-theme` before paint, so there is no flash.
2. The theme button (on every page, in the masthead or the session bar) toggles light and dark, stores the choice, and updates its `aria-label` ("Switch to dark theme").
3. While nothing is stored, a `matchMedia` listener follows system changes live.

Spacing is a 4px scale (`--space-1` 4px to `--space-8` 72px). Radius is 0 everywhere, except 2px on answer markers and full round on avatars and day dots. There are no shadows.

## Type and layout

- **Newsreader** (Google, opsz 6 to 72, weights 400/500/600, plus italic) for everything you read. **IBM Plex Mono** (400/500) for labels, buttons, numbers and dates. Load both with `next/font/google` and expose them as `--font-serif` and `--font-mono`.
- Text styles are the `.t-*` classes in `tokens.css`. Phone sizes: titles 36 to 42px, lesson text 18.5px / 1.55. Desktop lesson text: 20 to 21px / 1.6.
- Labels are mono, 12px, 0.08em tracking, uppercase. Buttons are mono, 15px, sentence case.
- Breakpoints: phone below 768px, tablet 768 to 1119px, desktop from 1120px. Everything works at 320px.
- Gutters: 24px on phone, 72px on desktop. Content max width 1296px. Reading column (lessons and tests) 680px max, centred.
- Two-column pages use `flex-wrap` (main column basis 520 to 560px, side column 320 to 380px), so they stack without media queries.
- On phones, session actions sit in a footer pinned to the bottom of the viewport. Signed-in pages get a three-tab bar (Today, Library, Stats); the current tab has a 3px accent top border.
- The masthead closes with a double rule: 3px ink, 3px gap, 1px ink.
- Touch targets are 44px minimum. Primary buttons are 52 to 58px tall.

## Components

| Component | Props | States | Notes |
| --- | --- | --- | --- |
| `Button` | `variant` primary, secondary, quiet · `busy` · `disabled` · `icon` · `fullWidth` · `href` | default, hover (primary turns accent), focus, busy, disabled | Disabled is a dashed muted outline and the label says why ("Submit · answer 2 more"). Busy shows the writing caret. |
| `AnswerOption` | `letter` · `text` · `selected` · `result` none, correct, incorrect, dimmed · `unsure` · `onSelect` | default, selected, correct, incorrect, dimmed, Not sure | `role="radio"` inside a `radiogroup`. Tags "Selected", "Your answer", "Correct answer" are required text. Not sure: dashed border, italic, "?" marker. |
| `Question` | `prompt` · `options` · `mode` instant or deferred · `explanation` | unanswered, answered, revealed | `instant` for recall and checks (reveal on select), `deferred` for tests (reveal after submit). Explanation leads with a mono verdict: "Correct." or "Not quite." |
| `QuestionNav` | `count` · `current` · `answered[]` · `onJump` | current, answered, not answered | Tests only. Five buttons on phone, a list with difficulty on desktop. |
| `SessionProgress` | `steps` · `current` · `hasRecall` | done, current, upcoming | Recall disappears and steps renumber when there's no history. |
| `LessonBody` | `paragraphs` (3) · `streaming` · `dropCap` | writing, written | Reserves three paragraph slots as `--paper-sunk` lines while writing. Daily lessons use a drop cap. |
| `AskBox` | `lessonId` · `onAsk` · `onExplainDifferently` · `stream` | empty, answering, answered, failed | Not persisted. Unmounting clears it. The italic note says so. |
| `TextField` | `label` · `type` · `error` · `help` · `maxLength` · `readOnly` · `revealable` | default, error, read-only, counted | Errors appear in context after submit, linked with `aria-describedby`. Password has a Show/Hide toggle with `aria-pressed`. |
| `StatusLabel` | `status` notStarted, inProgress, completed, done | | Ring, half ring or check, plus a word. |
| `ProgressMeter` | `lessonsDone` · `passed` | | Six cells, the last dashed until the Mastery Check is passed. Always shows the percent as text. |
| `StreakMark` | `count` · `week` · `todayDone` · `size` | active, done today, zero | Newsreader numeral in accent. Today undone is a dashed ring with "Today still counts until midnight." Zero is muted, never a warning. |
| `Masthead` | `user` · `guestProgress` · `current` | signed out, guest with progress, signed in | Account button shows photo or initial; menu shows name (or email), email, Profile, Sign out. |
| `SessionBar` | `onLeave` · `leaveLabel` | | Replaces the masthead in sessions and tests: close, name, theme. |
| `Notice` | `tone` error or info · `title` · `body` · `kept` · `primary` · `secondary` | | Every failure has a retry and a way to leave. `kept` names what was saved. |
| `ConfirmDialog` | `title` · `body` · `confirmLabel` · `onConfirm` · `onCancel` | | `role="alertdialog"`, focus trapped, starts on "Keep it", Escape cancels. |

Also: `SeriesRow`, `LessonRow` (with the "why this is in your series" line), `SubjectToggle` (`aria-pressed`), `StatBars`, `ThemeButton`, `BottomTabs`.

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
- A lesson is finished once its check is answered, right or wrong.
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

- [ ] All text 4.5:1 (measured: `--ink-muted` 6.1:1 light, 7.7:1 dark; `--accent` 4.8:1 light, 7.2:1 dark).
- [ ] Real `button`, `a`, `input` everywhere, with visible labels. Icon-only buttons have an `aria-label`.
- [ ] Visible focus on everything, never removed.
- [ ] Questions are radio groups: arrows move, Space selects. Desktop shortcuts: A to D, N for Not sure.
- [ ] Status never relies on color alone: glyph plus word.
- [ ] Session rail uses `aria-current="step"`; done steps have hidden ", done".
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
| Email links | Work for one hour, once | Whatever the auth provider uses |
