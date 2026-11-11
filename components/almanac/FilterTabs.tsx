import { cx } from "./cx";

export type FilterTab<T extends string> = { value: T; label: string; count?: number };

type FilterTabsProps<T extends string> = {
  tabs: FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, for example "Show series". */
  label: string;
  className?: string;
};

/** Underlined text tabs with counts. The selected one has a 2px accent underline, never a fill. */
export function FilterTabs<T extends string>({ tabs, value, onChange, label, className }: FilterTabsProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-wrap gap-x-6 gap-y-1", className)}>
      {tabs.map((tab) => {
        const on = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(tab.value)}
            className={cx(
              "min-h-11 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-0 font-label text-[13px] transition-colors duration-(--duration-instant) ease-out",
              on ? "border-(--accent) text-(--ink)" : "border-transparent text-(--ink-muted) hover:text-(--ink)"
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-2 text-(--ink-muted)">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
