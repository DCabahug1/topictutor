import { cx } from "@/components/almanac/cx";
import { CrossIcon } from "@/components/almanac/icons";

/** A test question or a "writing" line, under its eyebrow. */
export const QUESTION_HEADING =
  "after-eyebrow m-0 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] [overflow-wrap:anywhere] md:text-[48px]";

/** Reserved lines while a page reads its data. `label` is read aloud. */
export function LoadingLines({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <span className="h-3 w-40 bg-(--paper-sunk)" />
        <span className="mt-4 h-12 w-[70%] bg-(--paper-sunk)" />
      </div>
    </div>
  );
}

/** A short error line beside a control, with a glyph so it never relies on colour. */
export function InlineAlert({ children, className }: { children: string; className?: string }) {
  return (
    <p role="alert" className={cx("m-0 flex items-start gap-[6px] text-[16px] leading-[1.4] text-(--incorrect)", className)}>
      <CrossIcon size={14} className="mt-[3px] flex-none" />
      {children}
    </p>
  );
}
