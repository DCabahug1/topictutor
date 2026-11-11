import { cx } from "./cx";

export type StatBar = {
  /** Printed with the bar: "Wed" under a column, "Science" beside a row. */
  label: string;
  /** Read aloud in place of the label, for example "Wednesday". */
  spoken?: string;
  value: number;
  /** Today. Its label is ink, and an empty bar is dashed because the day isn't over. */
  current?: boolean;
};

type StatBarsProps = {
  /** What is counted. It opens the label read aloud: "Lessons finished". */
  title: string;
  bars: StatBar[];
  /** columns: one bar per day, the number above it. rows: one line per subject, the number at the end. */
  layout: "columns" | "rows";
  /** The value a full bar stands for. Defaults to the largest value. */
  max?: number;
  className?: string;
};

// The tallest column, in a 180px chart that leaves room for the number above it.
const COLUMN_HEIGHT = 140;

/**
 * The bar charts on Stats. One image for screen readers, with every value in
 * its label, and every number printed beside its bar as well.
 */
export function StatBars({ title, bars, layout, max, className }: StatBarsProps) {
  if (bars.length === 0) return null;
  const full = Math.max(max ?? 0, ...bars.map((bar) => bar.value), 1);
  const label = `${title}: ${bars.map((bar) => `${bar.spoken ?? bar.label} ${bar.value}`).join(", ")}.`;

  if (layout === "rows") {
    return (
      <div role="img" aria-label={label} className={className}>
        {bars.map((bar) => (
          <div
            key={bar.label}
            className="grid grid-cols-[120px_minmax(0,1fr)_32px] items-center gap-3 py-2 md:grid-cols-[180px_minmax(0,1fr)_40px]"
          >
            <span className="text-[17px] leading-[1.2]">{bar.label}</span>
            <span className="h-3 bg-(--paper-sunk)">
              <span className="block h-full bg-(--ink-muted)" style={{ width: `${Math.round((bar.value / full) * 100)}%` }} />
            </span>
            <span className="text-right font-label text-[13px]">{bar.value}</span>
          </div>
        ))}
      </div>
    );
  }

  const columns = { gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` };
  return (
    <div role="img" aria-label={label} className={className}>
      <div className="grid h-[180px] items-end gap-2 border-0 border-b border-solid border-(--ink) md:gap-4" style={columns}>
        {bars.map((bar) => (
          <div key={bar.label} className="flex h-full flex-col items-center justify-end gap-[6px]">
            <span className="font-label text-[12px] text-(--ink-muted)">{bar.value || (bar.current ? "·" : "0")}</span>
            <span
              className={cx(
                "box-border w-full",
                bar.value ? "bg-(--ink-muted)" : "h-[2px]",
                !bar.value && (bar.current ? "border border-dashed border-(--ink)" : "bg-(--ink-muted)")
              )}
              style={bar.value ? { height: Math.max(2, Math.round((bar.value / full) * COLUMN_HEIGHT)) } : undefined}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 grid gap-2 text-center font-label text-[11px] text-(--ink-muted) md:gap-4" style={columns}>
        {bars.map((bar) => (
          <span key={bar.label} className={cx(bar.current && "font-medium text-(--ink)")}>
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
