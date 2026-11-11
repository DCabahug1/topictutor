# TopicTutor redesign: build brief for Claude Code

You are rebuilding the TopicTutor front end in a new visual design called **Almanac**. The product behavior stays the same. The look, layout, components and copy change. Everything you need is in this folder, so you don't need any outside links.

## What's in this folder

| Path | What it is | When to read it |
| --- | --- | --- |
| `HANDOFF.md` | This brief: rules, build order, definition of done | First |
| `design/spec.md` | Tokens, type, layout, components and props, routes and states, motion, accessibility, open decisions | Before each phase |
| `design/tokens.css` | Every token as CSS variables for light and dark, plus text-style classes and base styles | Phase 1, then import everywhere |
| `design/tokens.json` | The same tokens as data | If you map tokens into Tailwind or TS |
| `design/system/README.md` | The brand book: principles, voice, color, type, motion, icons | Phase 1 |
| `design/system/components/*/` | A live HTML preview plus usage notes for 9 core components | Phase 2 |
| `design/reference/*.dc.html` | The source of every designed screen and state. Start with `design/reference/README.md` | Whenever you build a screen |

## Ground rules

1. **Survey before changing anything.** Read the repo first. Map each existing route, data source and API call to the routes in `design/spec.md`. Keep the data layer, auth, AI calls and database as they are. This is a UI rebuild. If a designed state has no data behind it yet (for example "guest daily limit"), make the UI and list the gap; don't invent backend behavior.
2. **Match the reference screens.** Spacing, sizes, copy and states come from `design/reference/`. Rebuild them as clean React components that use the CSS variables. Never copy the inline styles or the `.dc.html` runtime into the app.
3. **Tokens only.** No raw hex values in components. Use `var(--…)` or the `.t-*` text classes. If the repo uses Tailwind, map the tokens into the theme as CSS variables. If it doesn't, use CSS Modules. Don't add a component library.
4. **Both themes, every screen.** Check every component and page in light and dark before calling it done.
5. **Status never by color alone.** Correct and wrong, pass and fail, and series status always have a glyph and a word.
6. **Keep what the product leaves out.** No XP, badges, daily goals, email reminders, payments or subscriptions.
7. **Copy.** Use the reference copy as written. Sentence case, no em dashes, no error codes.
8. **Work in phases.** Commit at the end of each phase with a short summary of what's done and what's missing. If you're unsure about a design call, check "Open decisions" in `design/spec.md`. If it isn't covered there, build it as drawn and list it.

## Phase 0: survey (no code changes)

- List the framework version, styling approach, routes, data fetching, auth provider, and how lesson, test and tutor generation currently stream.
- Produce a table: new route → existing route or file → data it needs → gaps.
- Stop and post the table before Phase 1.

## Phase 1: foundations

- Load Newsreader (opsz, 400/500/600, italic) and IBM Plex Mono (400/500) with `next/font/google`, exposed as `--font-serif` and `--font-mono`.
- Add `design/tokens.css` as the global stylesheet (keep the `.t-*` classes and base rules).
- Add the theme script to `<head>` before paint:

```html
<script>
(function () {
  try {
    var s = localStorage.getItem('theme');
    var t = s || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
  } catch (e) { document.documentElement.dataset.theme = 'light'; }
})();
</script>
```

- Build `ThemeButton`: it toggles `data-theme`, saves to `localStorage.theme`, switches its icon (moon or sun) and its `aria-label`, and follows system changes while nothing is saved. Put `suppressHydrationWarning` on `<html>`.
- Build `Masthead` (signed out, guest with progress, signed in with account menu), `SessionBar`, and `BottomTabs` for signed-in phones.
- **Done when:** an empty page shows the masthead in both themes with no flash on reload, and focus rings show on every control.

## Phase 2: core components

Build every component in the Components table of `design/spec.md`, matching `design/system/components/*/preview.html`. Add a dev-only `/dev/components` page that shows every component in every state, in light and dark side by side.

- **Done when:** every state in the table renders on `/dev/components`, all are reachable by keyboard, and nothing uses a hex value.

## Phase 3: the daily session (the most important part)

Match `SessionPrototype.dc.html` (phone, clickable) and `DesktopLesson`, `DesktopCheck`, `DesktopFinish`, `DeskInterests`, `DeskAccountOffer`.

- Steps: Recall (skipped with no history), Lesson, Check (1 or 2 questions), Finish.
- A lesson opened for the first time streams in, following "Motion and streaming" in the spec. Later visitors get it instantly.
- Ask box: type a question or "Explain this differently", stream the answer, nothing saved.
- Answering the check finishes the lesson, right or wrong. The streak goes up with the 640ms finish animation, or instantly with reduced motion.
- Guests then get the subject picker and the account offer. After finishing, the rest of the day shows "done for today" and tomorrow's subject.
- **Done when:** a guest can go from `/` to the finish in one click plus answers, a returning learner sees recall first, and both work at 320px, in both themes, with reduced motion on.

## Phase 4: Go Deeper

Match `DeeperPrototype.dc.html` plus `DeskStart`, `DeskPlacementTaking`, `DeskPlacement`, `DeskOverview`, `DeskSample`, `DeskSeriesLesson`, `DeskMasteryEarly`, `DeskMasteryPass`, `DeskMasteryFail`.

- Start a series, filled in when arriving from Go Deeper or a suggestion.
- Placement test: 5 questions plus Not sure, answers changeable until submit, submit locked until all are answered, saved on every change.
- Results: score, the focus line built from the missed questions, and every answer with its explanation. Outline writing starts automatically.
- Series overview: each lesson's "why this is in your series" line comes from the placement answers. Six-cell progress. Delete with confirmation.
- Series lessons: the first open streams, the next lesson is prepared ahead. Previous and next. The last lesson leads to the Mastery Check or lists what's unfinished.
- Mastery Check: not open yet, writing, taking, passed (with 2 or 3 suggestions that prefill a new series), not passed (guided review, retake always available).
- Sample series: public, working checks.

## Phase 5: Today, Library, Stats, Landing

Match `Today`, `Library`, `Stats` and `Landing` (each has a `*States` board with every variant).

- Library search filters as you type across title, category and description. Filters show counts. Past daily lessons are listed and readable.
- Stats: streak as the centerpiece, lessons per day for the last 7 days, recall accuracy, series completed and Mastery scores, and a by-subject breakdown. A zero state for new learners.
- Profile: photo upload with a preview before saving, name (25 max, with a counter), read-only email, subjects, and Save with saving, saved and failed states.

## Phase 6: account pages and every remaining state

Match `Auth` / `AuthStates` and `StateScreen` / `StatesBoard`: log in, register, check your email, password reset (request, sent, set new, done), failed or expired links, every generation failure (retry plus a way out), the guest limits, not found, and failed to load. Signed-in users never see log in or register, and logging in goes to `/today`.

## Phase 7: QA

- Run the accessibility checklist in `design/spec.md`.
- Check every page at 320, 390, 768, 1120 and 1440px wide, in both themes, and with reduced motion on.
- Post a final summary: what's done, any differences from the reference and why, and backend gaps found in Phase 0.

## First message to start with

> Read `HANDOFF.md`, then `design/spec.md` and `design/reference/README.md`. Do Phase 0 and stop with the route mapping table.
