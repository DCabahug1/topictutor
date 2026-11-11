import { cx } from "./cx";

type SubjectToggleProps = {
  name: string;
  on: boolean;
  onToggle: () => void;
  /** tile: the first-time picker. row: the compact list in Profile, with the accent bar on the left. */
  variant?: "tile" | "row";
  className?: string;
};

/**
 * One subject tile in a picker. Selected is raised paper with a 4px accent bar
 * and "✓ In"; not selected is transparent with muted text and "+ Add". Never the
 * ink fill. Place tiles in a `SubjectGrid` so their hairlines meet.
 */
export function SubjectToggle({ name, on, onToggle, variant = "tile", className }: SubjectToggleProps) {
  if (variant === "row") {
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={onToggle}
        className={cx(
          "relative -mb-px -mr-px flex min-h-[60px] cursor-pointer items-center justify-between gap-3 border border-solid border-(--ink) px-4 text-left font-serif text-[19px] transition-colors duration-(--duration-instant) ease-out",
          on ? "bg-(--paper-raised) text-(--ink)" : "bg-transparent text-(--ink-muted) hover:text-(--ink)",
          className
        )}
      >
        {on && <span aria-hidden="true" className="absolute inset-y-0 -left-px w-1 bg-(--accent)" />}
        <span>{name}</span>
        <span aria-hidden="true" className={cx("font-mono text-[12px]", on ? "text-(--accent)" : "text-(--ink-muted)")}>
          {on ? "✓" : "+"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cx(
        "relative -mb-px -mr-px flex min-h-[92px] cursor-pointer flex-col justify-between gap-4 border border-solid border-(--ink) px-[18px] pb-4 pt-[18px] text-left font-serif transition-colors duration-(--duration-instant) ease-out md:min-h-[120px] md:pb-5",
        on ? "bg-(--paper-raised) text-(--ink)" : "bg-transparent text-(--ink-muted) hover:text-(--ink)",
        className
      )}
    >
      {on && <span aria-hidden="true" className="absolute inset-x-0 -top-px h-1 bg-(--accent)" />}
      <span
        aria-hidden="true"
        className={cx("font-mono text-[11px] uppercase tracking-[0.08em]", on ? "text-(--accent)" : "text-(--ink-muted)")}
      >
        {on ? "✓ In" : "+ Add"}
      </span>
      <span className="text-[22px] leading-[1.15] md:text-[26px]">{name}</span>
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
