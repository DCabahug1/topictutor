import Link from "next/link";
import { cx } from "./cx";
import { ArrowIcon } from "./icons";
import { StatusLabel } from "./StatusLabel";

export type LessonRowStatus = "done" | "upNext" | "notStarted";

type LessonRowProps = {
  /** 1 to 5, shown as 01 to 05. */
  number: number;
  title: string;
  description: string;
  /** Why this lesson is in the learner's series, from the placement answers. */
  why: string;
  /** True when the lesson is here because its placement question was missed: the why line turns accent. */
  focus: boolean;
  /**
   * done: the check is answered, right or wrong.
   * upNext: the lesson the main action opens. From 768px the row is lifted onto raised paper.
   */
  status: LessonRowStatus;
  /** Where the lesson opens. The title is the link and the whole row is its target. */
  href: string;
  className?: string;
};

/**
 * One lesson in a series overview. Use it inside an `ol`.
 * On phones the text stacks beside the number; from 768px the title, the
 * why line and the status sit in a wrapping row.
 */
export function LessonRow({ number, title, description, why, focus, status, href, className }: LessonRowProps) {
  const upNext = status === "upNext";
  return (
    <li
      className={cx(
        "group relative grid grid-cols-[30px_minmax(0,1fr)_18px] gap-[10px] border-0 border-b border-solid border-(--rule) py-4 md:flex md:flex-wrap md:items-start md:gap-x-6 md:gap-y-2 md:py-[22px]",
        upNext && "md:-mx-4 md:bg-(--paper-raised) md:px-4",
        className
      )}
    >
      <span
        className={cx(
          "font-mono text-[13px] leading-6 md:flex-[0_0_40px] md:text-[14px]",
          upNext ? "text-(--accent)" : "text-(--ink-muted)"
        )}
      >
        {String(number).padStart(2, "0")}
      </span>
      {/* One column on phones. From 768px its children join the row. */}
      <span className="min-w-0 md:contents">
        <span className="block min-w-0 md:flex-[999_1_380px]">
          <Link
            href={href}
            className="block text-[19px] font-medium leading-[1.25] text-(--ink) no-underline after:absolute after:inset-0 group-hover:text-(--accent) md:text-[24px] md:leading-[1.2]"
          >
            {title}
          </Link>
          <span className="mt-[3px] block text-[15px] leading-[1.4] text-(--ink-soft) md:mt-1 md:text-[17px]">
            {description}
          </span>
        </span>
        {why && (
          <span
            className={cx(
              "mt-[6px] block min-w-0 text-[14px] italic leading-[1.45] md:mt-0 md:flex-[1_1_240px] md:text-[16px]",
              focus ? "text-(--accent)" : "text-(--ink-muted)"
            )}
          >
            {why}
          </span>
        )}
        <StatusLabel
          status={status === "done" ? "done" : "notStarted"}
          label={status === "done" ? "Done" : upNext ? "Up next" : "Not started"}
          className={cx("mt-2 md:mt-[3px] md:flex-[0_0_130px]", upNext && "text-(--ink)!")}
        />
      </span>
      <ArrowIcon size={16} className="mt-[5px] group-hover:text-(--accent) md:hidden" />
    </li>
  );
}
