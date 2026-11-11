import { cx } from "./cx";
import { CheckIcon } from "./icons";

export type SessionStep = "recall" | "lesson" | "check" | "finish";

const LABELS: Record<SessionStep, string> = {
  recall: "Recall",
  lesson: "Lesson",
  check: "Check",
  finish: "Finish",
};

type SessionProgressProps = {
  current: SessionStep;
  /** False for a learner with no history: Recall is removed and the steps renumber. */
  hasRecall: boolean;
  className?: string;
};

/** The step rail at the top of the daily session. Steps are not links. */
export function SessionProgress({ current, hasRecall, className }: SessionProgressProps) {
  const steps: SessionStep[] = hasRecall ? ["recall", "lesson", "check", "finish"] : ["lesson", "check", "finish"];
  const currentIndex = steps.indexOf(current);

  return (
    <nav
      aria-label="Session progress"
      className={cx("border-b border-t-[3px] border-solid border-(--ink) pt-[3px]", className)}
    >
      <ol
        className="m-0 grid list-none p-0 font-mono text-[12px] uppercase tracking-[0.04em] md:tracking-[0.06em]"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className={cx(
                "flex items-center gap-[5px] pt-[11px]",
                isCurrent
                  ? "border-b-[3px] border-solid border-(--accent) pb-[7px] font-medium text-(--ink)"
                  : "pb-[10px] text-(--ink-muted)"
              )}
            >
              {done && <CheckIcon size={13} />}
              {done ? LABELS[step] : `${i + 1} ${LABELS[step]}`}
              {done && <span className="sr-only">, done</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
