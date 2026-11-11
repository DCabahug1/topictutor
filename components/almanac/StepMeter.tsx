import { cx } from "./cx";

type StepMeterProps = {
  /** How many steps. */
  steps: number;
  /** The current step, 0-based. Earlier steps show as done. */
  current: number;
  /** The one line that carries the progress, for example "Lesson · step 2 of 4". */
  label: string;
  className?: string;
};

/**
 * Thin bars, done in ink, current in accent, upcoming in rule, with one mono
 * line under them. The bars are hidden from screen readers: the line says it.
 */
export function StepMeter({ steps, current, label, className }: StepMeterProps) {
  return (
    <div className={className}>
      <div aria-hidden="true" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}>
        {Array.from({ length: steps }, (_, i) => (
          <span
            key={i}
            className={cx("h-[3px]", i < current ? "bg-(--ink)" : i === current ? "bg-(--accent)" : "bg-(--rule)")}
          />
        ))}
      </div>
      <p className="m-0 mt-[10px] font-mono text-[12px] uppercase tracking-[0.08em] text-(--ink-muted)">{label}</p>
    </div>
  );
}
