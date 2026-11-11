# TopicTutor Almanac

TopicTutor reads like a small daily paper. Each day is an edition: a dated masthead, one lesson set in a reading serif, and a few ruled lines that frame it. The product respects the learner's intelligence, so the design leans on typography and rules rather than illustration, badges or colour. The reward is the reading itself, and the one moment of celebration (the finish) is earned by restraint everywhere else.

## Principles

1. **Type first.** Hierarchy comes from Newsreader at different sizes and weights, and from IBM Plex Mono labels. If a screen needs a picture to make sense, the copy is wrong.
2. **Rules, not boxes.** Sections are separated by hairlines (`rule`) and the masthead double rule (`ink`, 3px over 1px). No shadows anywhere. Cards are used only for things you act on (today's lesson, answer options, a series).
3. **One vermilion mark.** `accent` appears once or twice per screen: the kicker, the current step, the streak number, focus. Never as a large fill.
4. **Square.** `radius-0` everywhere. Only avatars and day dots are round.
5. **Status is said, not coloured.** Every state carries a glyph and a word. Colour reinforces it.
6. **Calm motion.** Things fade and settle. Nothing bounces.

## Voice

- Plain, warm, a little dry. Short sentences. Sentence case for buttons and headings, uppercase only in mono labels.
- Talk about learning, not about the app: "You missed these two, so your series starts there." not "Our AI has analyzed your results."
- No exclamation marks except on the finish screen, and at most one there.
- Reassure in italics, in the margin voice: *Answers come from this lesson. Nothing is saved.*
- Never use em dashes in product copy. Use a full stop or a colon.

Examples:

| Situation | Write | Avoid |
| --- | --- | --- |
| Primary action on landing | Start today's lesson | Get started for free |
| Finish | Day 13. See you tomorrow. | Amazing job!!! |
| Wrong answer | Not quite. 1900 is divisible by 100 but not by 400. | Wrong! |
| Generation failed | The lesson didn't finish writing. Try again, or come back to it later. | Error 500 |

## Colour

Two themes, Light and Dark, follow the device by default and can be switched from the theme button on every page. Tokens are named by role, never by hue, so components work in both.

- **Ground:** `paper` for pages, `paper-raised` for cards and inputs, `paper-sunk` for wells and skeletons.
- **Text:** `ink` and `ink-muted` only. Both pass 4.5:1 on all three grounds in both themes.
- **Lines:** `rule` for decoration, `ink` for anything you can click.
- **Accent:** `accent` (vermilion) for marks and focus.
- **Feedback:** `correct` (ink blue) and `incorrect` (burnt orange), with `-wash` backgrounds. Blue against orange, plus a check or cross glyph and a word, so it never relies on hue.

## Type

- **Newsreader** (serif, Google Fonts) for everything you read: headlines, lessons, questions, options.
- **IBM Plex Mono** for the apparatus: labels, buttons, numbers, dates.
- Lesson text: `body` on phones, `body-lg` from 768px, measure capped at 64 characters.
- Titles are AI-written and may be long. Let them wrap; never truncate a lesson or series title. Truncate only option-free metadata (a long name in the account menu) with an ellipsis and a full value in the title attribute.

## Layout

- 4px base. Phone gutter `space-5` (24px), desktop gutter `space-8` (72px), content max width 1296px.
- Reading column: 640px max on desktop, centred, with the session progress and ask box sharing its width.
- Breakpoints: phone below 768px, tablet 768 to 1119px, desktop 1120px and up. Every page works at 320px wide.
- Touch targets are at least 44 by 44px. Primary actions on phone sit in a footer bar pinned to the bottom of the viewport.

## Motion

| Token | Use |
| --- | --- |
| `duration-instant` 120ms | Hover, press, selection, focus |
| `duration-step` 240ms | Step changes in the session, feedback reveal |
| `duration-moment` 640ms | The finish and Mastery Check pass, once per screen |

- Easing: `cubic-bezier(0.2, 0, 0, 1)` for entering, `cubic-bezier(0.4, 0, 1, 1)` for leaving.
- Step changes: the outgoing step fades out, the next fades in and rises 8px.
- **Writing text:** when a lesson is being written for the first time, words appear in place with a 120ms fade, behind a small vermilion block caret. Paragraph slots are reserved as `paper-sunk` lines so the page does not jump.
- **Finish moment:** the old streak number slides up and out, the new one slides in, and the masthead rule draws across from left to right.
- **Reduced motion:** every transition becomes an opacity crossfade of 120ms or less. Writing text appears a sentence at a time with no caret. The finish shows the new number directly.

## Iconography

Inline SVG, 24px grid, 1.6px stroke, round caps, no fills. A small set: close, arrow, check, cross, theme (moon and sun), send, search, more, trash, retry. Icons always sit beside a word except the theme, close and send buttons, which carry an aria-label.

## Accessibility

- Every control is a real button, link or input with a visible label.
- Focus: 2px `focus` outline, 2px offset, on everything, never removed.
- Answer options are radio groups: arrow keys move, Space selects, the check button submits.
- Live regions announce feedback ("Correct", "Not quite") and streaming tutor answers when they finish, not word by word.
- The theme follows `prefers-color-scheme` until the learner chooses, then remembers the choice.
