# TextField

Labelled text input for auth, profile and Start a series. Boxed in `ink` on `paper-raised`; the ask box and landing topic field use the underlined variant instead.

- The label is a mono uppercase `<label>`, always visible. Placeholders are examples, never instructions.
- Error: 2px `incorrect` border, `aria-invalid`, and a message with a cross glyph linked by `aria-describedby`. Errors appear in context after submit, not while typing.
- Password: a Show/Hide toggle button with `aria-pressed`.
- Read-only: dashed `ink-muted` border, and the label says why ("can't be changed").
- Counted fields (name, 25 max) show "5 / 25" beside the help text.
