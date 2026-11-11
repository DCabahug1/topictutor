import { cx } from "./cx";

type SubjectToggleProps = {
  name: string;
  on: boolean;
  onToggle: () => void;
  /** tile: the first-time picker. row: the compact list in Profile, with the accent bar on the left. */
  variant?: "tile" | "row";
  /** A subject the learner added: shows a × that removes it. */
  onRemove?: () => void;
  className?: string;
};

const TILE =
  "relative -mb-px -mr-px flex min-h-[92px] flex-col justify-between gap-4 border border-solid border-(--ink) px-[18px] pb-4 pt-[18px] text-left font-serif transition-colors duration-(--duration-instant) ease-out md:min-h-[120px] md:pb-5";
const ROW =
  "relative -mb-px -mr-px flex min-h-[60px] items-center justify-between gap-3 border border-solid border-(--ink) px-4 text-left font-serif text-[19px] transition-colors duration-(--duration-instant) ease-out";

/**
 * One subject tile in a picker. Selected is raised paper with a 4px accent bar
 * and "✓ In"; not selected is transparent with muted text and "+ Add". Never the
 * ink fill. Place tiles in a `SubjectGrid` so their hairlines meet.
 */
export function SubjectToggle({ name, on, onToggle, variant = "tile", onRemove, className }: SubjectToggleProps) {
  const look = on ? "bg-(--paper-raised) text-(--ink)" : "bg-transparent text-(--ink-muted) hover:text-(--ink)";
  const remove = onRemove && (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${name}`}
      className={cx(
        "absolute z-[1] flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 font-label text-[18px] leading-none text-(--ink-muted) hover:text-(--ink)",
        variant === "row" ? "right-1 top-1/2 -translate-y-1/2" : "right-1 top-1"
      )}
    >
      <span aria-hidden="true">×</span>
    </button>
  );

  if (variant === "row") {
    return (
      <div className={cx("relative -mb-px -mr-px flex min-w-0", className)}>
        <button
          type="button"
          aria-pressed={on}
          onClick={onToggle}
          title={name}
          className={cx(ROW, "mb-0! mr-0! min-w-0 flex-auto cursor-pointer", onRemove && "pr-14", look)}
        >
          {on && <span aria-hidden="true" className="absolute inset-y-0 -left-px w-1 bg-(--accent)" />}
          {/* One line: a long name is cut with an ellipsis, and the title shows it whole. */}
          <span className="min-w-0 truncate">{name}</span>
          {!onRemove && (
            <span aria-hidden="true" className={cx("font-label text-[12px]", on ? "text-(--accent)" : "text-(--ink-muted)")}>
              {on ? "✓" : "+"}
            </span>
          )}
        </button>
        {remove}
      </div>
    );
  }

  return (
    <div className={cx("relative -mb-px -mr-px flex min-w-0", className)}>
      <button
        type="button"
        aria-pressed={on}
        onClick={onToggle}
        title={name}
        className={cx(TILE, "mb-0! mr-0! min-w-0 flex-auto cursor-pointer", look)}
      >
        {on && <span aria-hidden="true" className="absolute inset-x-0 -top-px h-1 bg-(--accent)" />}
        <span
          aria-hidden="true"
          className={cx("font-label text-[11px] uppercase tracking-[0.08em]", on ? "text-(--accent)" : "text-(--ink-muted)")}
        >
          {on ? "✓ In" : "+ Add"}
        </span>
        <span className="block w-full min-w-0 truncate text-[22px] leading-[1.15] md:text-[26px]">{name}</span>
      </button>
      {remove}
    </div>
  );
}

type AddSubjectTileProps = {
  /** The field is open, so the tile reads as active. */
  open: boolean;
  /** At the limit: nothing more can be added. */
  full: boolean;
  /** For the full state, like "5 of 5". */
  count: string;
  onClick: () => void;
  variant?: "tile" | "row";
  className?: string;
};

/** The last tile in a picker: opens the field for a subject of the learner's own. */
export function AddSubjectTile({ open, full, count, onClick, variant = "tile", className }: AddSubjectTileProps) {
  const look = full
    ? "cursor-not-allowed border-dashed! bg-transparent text-(--ink-muted)"
    : open
      ? "cursor-pointer border-dashed! bg-(--paper-raised) text-(--ink)"
      : "cursor-pointer border-dashed! bg-transparent text-(--ink-muted) hover:text-(--ink)";
  const label = full ? `${count} added` : "Add your own";

  if (variant === "row") {
    return (
      <button type="button" disabled={full} aria-expanded={open} onClick={onClick} className={cx(ROW, look, className)}>
        <span>{label}</span>
        {!full && (
          <span aria-hidden="true" className="font-label text-[12px] text-(--ink-muted)">
            +
          </span>
        )}
      </button>
    );
  }

  return (
    <button type="button" disabled={full} aria-expanded={open} onClick={onClick} className={cx(TILE, look, className)}>
      <span aria-hidden="true" className="font-label text-[11px] uppercase tracking-[0.08em] text-(--ink-muted)">
        {full ? "Limit reached" : "+ New"}
      </span>
      <span className="text-[22px] leading-[1.15] md:text-[26px]">{label}</span>
    </button>
  );
}

/** Lays tiles out so their hairlines meet: two columns on phones, four (or three for rows) from 768px. */
export function SubjectGrid({
  label,
  columns = 4,
  children,
  className,
}: {
  label: string;
  columns?: 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("grid grid-cols-2 pb-px pr-px", columns === 4 ? "md:grid-cols-4" : "md:grid-cols-3", className)}
    >
      {children}
    </div>
  );
}
