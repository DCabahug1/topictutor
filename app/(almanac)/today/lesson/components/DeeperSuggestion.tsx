import type { ReactNode } from "react";
import { cx } from "@/components/almanac/cx";
import { deeperTitle } from "./copy";

type DeeperSuggestionProps = {
  /** Today's lesson's related topic. */
  topic: string;
  /** The action under the header, when the block stands on its own (Finish's second path). */
  action?: ReactNode;
  className?: string;
};

/**
 * Today's related topic, named as a header so the button under it can stay a
 * short action: "Start this series". A hairline sets it off from what comes before.
 */
export function DeeperSuggestion({ topic, action, className }: DeeperSuggestionProps) {
  return (
    <div className={cx("min-w-0 border-0 border-t border-solid border-(--rule) pt-7", className)}>
      <p className="t-eyebrow m-0">Go deeper · five lessons</p>
      <h2 className="t-title after-eyebrow m-0 max-w-[620px] [overflow-wrap:anywhere]">{deeperTitle(topic)}</h2>
      <p className="m-0 mt-3 max-w-[520px] text-[17px] italic leading-normal text-(--ink-muted) md:text-[18px]">
        A short placement test, then a series that starts where you are.
      </p>
      {action && <div className="mt-6 max-md:[&>a]:w-full">{action}</div>}
    </div>
  );
}
