import { cx } from "@/components/almanac/cx";
import { CrossIcon } from "@/components/almanac/icons";

/** The double rule under the session bar on test screens: 3px ink, 3px gap, 1px ink. */
export function TestRule() {
  return (
    <div
      aria-hidden="true"
      className="mt-[2px] box-content h-[3px] border-0 border-b border-t-[3px] border-solid border-(--ink) md:mt-0"
    />
  );
}

/** Reserved lines while a page reads its data. `label` is read aloud. */
export function LoadingLines({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="pt-7 md:pt-12">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <span className="h-3 w-40 bg-(--paper-sunk)" />
        <span className="mt-2 h-10 w-[70%] bg-(--paper-sunk)" />
      </div>
    </div>
  );
}

/** A short error line beside a control, with a glyph so it never relies on colour. */
export function InlineAlert({ children, className }: { children: string; className?: string }) {
  return (
    <p role="alert" className={cx("m-0 flex items-start gap-[6px] text-[15px] leading-[1.4] text-(--incorrect)", className)}>
      <CrossIcon size={14} className="mt-[3px] flex-none" />
      {children}
    </p>
  );
}
