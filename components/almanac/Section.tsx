import type { ReactNode } from "react";
import { cx } from "./cx";

type SectionProps = {
  title: ReactNode;
  /** Sits at the end of the heading line, for example "All series" or a search field. */
  aside?: ReactNode;
  /** Goes between the heading and the rule, for example filter tabs. */
  tools?: ReactNode;
  id?: string;
  /** Leaves out the long gap above, when the section follows something small. */
  tight?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A group after the lead: set apart by space, not boxes. A serif heading, then
 * an ink hairline that ruled rows hang from.
 */
export function Section({ title, aside, tools, id, tight = false, className, children }: SectionProps) {
  return (
    <section aria-labelledby={id ? `${id}-heading` : undefined} id={id} className={cx(!tight && "mt-(--section-gap)", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
        <h2 id={id ? `${id}-heading` : undefined} className="t-section m-0">
          {title}
        </h2>
        {aside}
      </div>
      {tools && <div className="mt-6">{tools}</div>}
      <div className={cx("border-0 border-t border-solid border-(--ink)", tools ? "mt-0" : "mt-5")}>{children}</div>
    </section>
  );
}
