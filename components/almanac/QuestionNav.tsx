import { cx } from "./cx";
import { CheckIcon } from "./icons";

type QuestionNavProps = {
  count: number;
  /** Zero-based index of the question on screen. */
  current: number;
  /** One entry per question. */
  answered: boolean[];
  onJump: (index: number) => void;
  /** row: five buttons, for phones. list: one line per question with its level, for desktop. */
  variant?: "row" | "list";
  /** List variant: a short line per question, for example its difficulty. */
  meta?: string[];
  className?: string;
};

/** Jumps between questions in a placement test or Mastery Check. */
export function QuestionNav({ count, current, answered, onJump, variant = "row", meta, className }: QuestionNavProps) {
  const indexes = Array.from({ length: count }, (_, i) => i);

  if (variant === "list") {
    return (
      <nav aria-label="Questions" className={className}>
        <ol className="m-0 list-none border-b border-(--rule) p-0">
          {indexes.map((i) => {
            const isCurrent = i === current;
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => onJump(i)}
                  className={cx(
                    "grid w-full cursor-pointer grid-cols-[28px_minmax(0,1fr)] gap-[10px] border-0 border-t border-solid border-(--rule) p-[14px] text-left",
                    isCurrent ? "bg-(--ink) text-(--on-ink)" : "bg-transparent text-(--ink) hover:bg-(--paper-sunk)"
                  )}
                >
                  <span className="font-mono text-[13px]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="font-serif text-[17px] leading-tight">{meta?.[i] ?? `Question ${i + 1}`}</span>
                    <span
                      className={cx(
                        "inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.06em]",
                        !isCurrent && !answered[i] && "text-(--ink-muted)"
                      )}
                    >
                      {answered[i] && <CheckIcon size={11} strokeWidth={3} />}
                      {answered[i] ? "Answered" : "Not answered"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Questions"
      className={cx("grid gap-[6px]", className)}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {indexes.map((i) => {
        const isCurrent = i === current;
        return (
          <button
            key={i}
            type="button"
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Question ${i + 1}, ${answered[i] ? "answered" : "not answered"}`}
            onClick={() => onJump(i)}
            className={cx(
              "flex h-11 cursor-pointer items-center justify-center gap-1 border-[1.5px] font-mono text-[13px]",
              isCurrent && "border-solid border-(--ink) bg-(--ink) text-(--on-ink)",
              !isCurrent && answered[i] && "border-solid border-(--ink) bg-transparent text-(--ink)",
              !isCurrent && !answered[i] && "border-dashed border-(--ink-muted) bg-transparent text-(--ink-muted)"
            )}
          >
            {answered[i] && <CheckIcon size={11} strokeWidth={3} />}
            {i + 1}
          </button>
        );
      })}
    </nav>
  );
}
