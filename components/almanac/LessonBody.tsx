import { sectionSlots } from "@/lib/almanac/rules";
import { cx } from "./cx";
import { Markdown } from "./Markdown";

type LessonBodyProps = {
  /** The text written so far, one entry per paragraph. Missing entries show as reserved lines. */
  paragraphs: string[];
  /** True while the lesson is still being written. */
  streaming?: boolean;
  /** Daily lessons open with a drop cap. */
  dropCap?: boolean;
  /** How many paragraphs to reserve room for while writing. */
  slots?: number;
  className?: string;
};

/**
 * Lesson text, one markdown section per entry. While writing, unwritten sections
 * are held as sunk lines so the page does not jump, and a caret follows the last word.
 */
export function LessonBody({ paragraphs, streaming = false, dropCap = false, slots = 3, className }: LessonBodyProps) {
  const count = sectionSlots(paragraphs.length, slots, streaming);
  const lastStarted = paragraphs.reduce((last, text, i) => (text ? i : last), -1);

  return (
    <div
      aria-busy={streaming}
      className={cx(
        "flex flex-col gap-[18px] text-[19px] leading-[1.65] text-(--ink-soft) md:gap-[22px] md:text-[21px]",
        className
      )}
    >
      {Array.from({ length: count }, (_, i) => {
        const text = paragraphs[i];
        if (!text) {
          return (
            <div key={i} aria-hidden="true" className="flex flex-col gap-[10px] pt-[6px]">
              <span className="h-[14px] bg-(--paper-sunk)" />
              <span className="h-[14px] bg-(--paper-sunk)" />
              <span className="h-[14px] bg-(--paper-sunk)" />
              <span className="h-[14px] w-[62%] bg-(--paper-sunk)" />
            </div>
          );
        }
        return (
          <Markdown key={i} dropCap={dropCap && i === 0} streaming={streaming && i === lastStarted}>
            {text}
          </Markdown>
        );
      })}
    </div>
  );
}
