# Button

Square, mono-labelled buttons in three weights: primary (ink fill), secondary (ink outline) and quiet (underlined text).

- One primary per view. On phones the primary sits full width in the pinned footer.
- Primary hover turns vermilion (`accent`). Secondary hover fills with `paper-sunk`.
- Disabled buttons use a dashed `ink-muted` outline and must say why in the label, for example "Submit · 3 of 5 answered".
- Working state: `aria-busy="true"`, the vermilion writing caret, and a label that says what is happening.
- Minimum height 52px (44px for compact secondary buttons in toolbars). Focus: 2px `focus` ring, 2px offset.
- Links that look like buttons are `<a>` elements with the same classes.
- Props: `variant` (primary, secondary, quiet), `icon` (trailing arrow only), `busy`, `disabled`, `fullWidth`.
