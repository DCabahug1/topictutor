import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { StatusLabel } from "@/components/almanac/StatusLabel";
import type { DailySession } from "@/lib/almanac";
import { deeperHref, spellOut } from "../lesson/components/copy";

/** "8:12 pm", in the learner's own timezone. */
function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

type LessonCardProps = {
  session: DailySession;
  /** A learner with no finished lessons yet. */
  isNew: boolean;
};

/** Today's lesson on the Today page: not started, picked up part way, or done. */
export function LessonCard({ session, isNew }: LessonCardProps) {
  const { lesson, recall } = session;
  const done = session.finishedAt !== null;
  const started = !done && (session.recallAnswer !== null || session.checkAnswers.some((a) => a !== null));
  const correct = lesson.check.filter((q, i) => session.checkAnswers[i] === q.correctIndex).length;
  const minutes = `About ${spellOut(lesson.minutes).toLowerCase()} ${lesson.minutes === 1 ? "minute" : "minutes"}.`;

  const line = session.finishedAt
    ? `You got ${correct} of ${lesson.check.length} on the check. Finished at ${clockTime(session.finishedAt)}.`
    : started
      ? `You’ve started. Pick up where you left off. ${minutes}`
      : isNew || !recall
        ? `${isNew ? "Your first lesson. " : ""}A short read, then a quick check. ${minutes}`
        : `Recall from ${recall.fromDay}, a short lesson, then a quick check. ${minutes}`;

  const word = done ? "Done" : started ? "In progress" : "Not started";

  return (
    <section aria-labelledby="today-heading" className="min-w-0 flex-[999_1_520px]">
      <h2 id="today-heading" className="t-label m-0 text-(--accent)">
        Today’s lesson
      </h2>
      <div
        className={cx(
          "mt-3 border border-solid bg-(--paper-raised) p-5 md:px-8 md:py-[30px]",
          // Once it is done the card steps back: nothing left to act on.
          done ? "border-(--rule)" : "border-(--ink)"
        )}
      >
        <StatusLabel
          status={done ? "done" : started ? "inProgress" : "notStarted"}
          label={`${word} · ${lesson.subject}`}
        />
        <p className="m-0 mt-[10px] text-[30px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[44px]">
          {lesson.title}
        </p>
        <p className="m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft) md:text-[19px]">{line}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          {done ? (
            <>
              <Button variant="secondary" href="/today/lesson?read=1" className="min-h-12! px-[18px]! text-[14px]!">
                Read it again
              </Button>
              <Link
                href={deeperHref(lesson.deeperTopic)}
                className="inline-flex min-h-12 items-center font-mono text-[14px] text-(--ink) underline underline-offset-4"
              >
                Go deeper on {lesson.deeperTopic}
              </Link>
            </>
          ) : (
            <Button size="large" icon href="/today/lesson">
              {started ? "Continue today’s lesson" : isNew ? "Start your first lesson" : "Start today’s lesson"}
            </Button>
          )}
        </div>
      </div>
      {done && (
        <p className="m-0 mt-[14px] text-[17px] italic text-(--ink-soft)">
          Tomorrow’s lesson is in{" "}
          <strong className="font-semibold not-italic text-(--ink)">{session.tomorrowSubject}</strong>. It arrives at
          midnight, your time.
        </p>
      )}
    </section>
  );
}
