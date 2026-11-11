import { cx } from "./cx";

/** The hero score on results screens: "3/5" in Newsreader, the total muted. */
export function ScoreNumeral({ score, total, className }: { score: number; total: number; className?: string }) {
  return (
    <p
      className={cx(
        "m-0 font-serif text-[96px] font-medium leading-[0.9] tracking-[-0.05em] md:text-[160px] md:leading-[0.85]",
        className
      )}
    >
      <span aria-hidden="true">
        {score}
        <span className="text-(--ink-muted)">/{total}</span>
      </span>
      <span className="sr-only">
        {score} of {total} correct
      </span>
    </p>
  );
}
