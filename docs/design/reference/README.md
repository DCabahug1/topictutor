# Reference screens

Each `.dc.html` file is one screen (or one component with several states) from the design canvas. Use them for exact layout, spacing, copy and behavior. **They are references, not code to copy**: rebuild them as React components using `../tokens.css`.

## How to read a file

- The markup lives inside `<x-dc>`. Styles are inline so every value is visible.
- `{{name}}` is a value filled in by the `renderVals()` function in the `<script type="text/x-dc">` block at the bottom.
- In that script, `t` is the theme (hex values that map onto tokens, see the table below), `z` is the size set for phone or desktop, and the rest is state and data.
- `<sc-if value="{{x}}">` renders only when `x` is true. `<sc-for list="{{items}}" as="item">` repeats.
- `<dc-import name="Today" variant="done" ...>` mounts another reference file with props. The `*States.dc.html` boards only do this.
- `data-props` on the script tag lists the props (the canvas calls them Tweaks), for example `variant`, `dark`, `phone`.

| `t.` key in the files | Token |
| --- | --- |
| `bg` | `--paper` |
| `raised` | `--paper-raised` |
| `sunk` | `--paper-sunk` |
| `ink` | `--ink` |
| `soft` | `--ink-soft` |
| `muted` | `--ink-muted` |
| `rule` | `--rule` |
| `accent` | `--accent` |
| `correct`, `correctWash` | `--correct`, `--correct-wash` |
| `incorrect`, `incorrectWash` | `--incorrect`, `--incorrect-wash` |

## File map

| File | Route | What it shows |
| --- | --- | --- |
| `SessionPrototype.dc.html` | `/today/lesson` (phone) | **Clickable.** Guest: landing, lesson writing, ask box, check, finish, subjects, account offer, done. Prop `returning` adds recall and a 12 to 13 streak. |
| `DesktopLesson.dc.html` | `/today/lesson` | Lesson step with a tutor answer, desktop light |
| `DesktopCheck.dc.html` | `/today/lesson` | Check with a wrong answer revealed, desktop dark |
| `DesktopFinish.dc.html` | `/today/lesson` | Finish for a returning learner, desktop |
| `DeskInterests.dc.html` | `/welcome/subjects` | Subject picker after the first lesson |
| `DeskAccountOffer.dc.html` | `/welcome/account` | Guest account offer, desktop dark |
| `DeeperPrototype.dc.html` | `/series/...` (phone) | **Clickable.** Start a series, placement test, results with outline writing, overview, lessons, Mastery Check pass or fail |
| `DeskStart.dc.html` | `/series/new` | Start a series, filled in from Go Deeper |
| `DeskPlacementTaking.dc.html` | `/series/new/placement` | Taking the test, question 3 of 5 |
| `DeskPlacement.dc.html` | `/series/new/results` | Score, focus line, answers, outline writing |
| `DeskOverview.dc.html` | `/series/[id]` | In progress, 2 of 5 |
| `DeskSample.dc.html` | `/series/sample` | Public sample series, guest view |
| `DeskSeriesLesson.dc.html` | `/series/[id]/[n]` | Lesson writing for the first time, dark |
| `DeskMasteryEarly.dc.html` | `/series/[id]/mastery` | Not open yet, lessons still to do |
| `DeskMasteryPass.dc.html` | `/series/[id]/mastery` | Passed, suggestions |
| `DeskMasteryFail.dc.html` | `/series/[id]/mastery` | Not passed, guided review, retake |
| `Landing.dc.html` + `LandingPhones.dc.html` | `/` | Full landing page. Prop `signedIn`. |
| `Today.dc.html` + `TodayStates.dc.html` | `/today` | Prop `variant`: established, notStarted, done, noSeries, newUser |
| `Library.dc.html` + `LibraryStates.dc.html` | `/library` | **Interactive** search, filters, delete. Props `variant` (full, loading, empty), `query`, `confirmOpen` |
| `Stats.dc.html` + `StatsStates.dc.html` | `/stats` | Props `variant` (rich, zero), `view` (stats, profile), `saveState` |
| `Auth.dc.html` + `AuthStates.dc.html` | `/login`, `/register`, `/reset` | Prop `variant`: login, loginError, register, registerError, checkEmail, resetRequest, resetSent, resetNew, resetDone, linkExpired |
| `StateScreen.dc.html` + `StatesBoard.dc.html` | any | Prop `variant`: dailyFail, seriesLessonFail, placementFail, outlineFail, masteryFail, guestUsed, guestDaily, lessonNotFound, seriesNotFound, loadFail |

Every file has a `dark` prop or is drawn in the theme its title says. Files with a `phone` prop switch to the phone layout.
