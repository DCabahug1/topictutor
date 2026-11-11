import { Caret } from "./Button";
import { cx } from "./cx";

type LessonBodyProps = {
  /** The text written so far, one entry per paragraph. Missing entries show as reserved lines. */
  paragraphs: string[];
  /** True while the lesson is still being written. */
  streaming?: boolean;
  /** Daily lessons open with a drop cap. */
  dropCap?: boolean;
  /** How many paragraphs to reserve room for. */
  slots?: number;
  className?: string;
};

/**
 * Lesson text. While writing, unwritten paragraphs are held as sunk lines so the
 * page does not jump, and a caret follows the last word.
 */
export function LessonBody({ paragraphs, streaming = false, dropCap = false, slots = 3, className }: LessonBodyProps) {
  const count = Math.max(slots, paragraphs.length);
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
        const withCap = dropCap && i === 0;
        return (
          <p key={i} className="m-0">
            {withCap && (
              <>
                <span
                  aria-hidden="true"
                  className="float-left pr-[10px] pt-[6px] text-[60px] font-medium leading-[0.82] text-(--ink) md:text-[76px]"
                >
                  {text[0]}
                </span>
                <span className="sr-only">{text[0]}</span>
              </>
            )}
            {withCap ? text.slice(1) : text}
            {streaming && i === lastStarted && <Caret inText />}
          </p>
        );
      })}
    </div>
  );
}
