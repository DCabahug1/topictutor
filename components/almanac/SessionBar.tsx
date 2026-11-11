import Link from "next/link";
import { CloseIcon } from "./icons";
import { ThemeButton } from "./ThemeButton";

type SessionBarProps = {
  /** Where the close control goes. Use `onLeave` instead when leaving needs to do something first. */
  leaveHref?: string;
  onLeave?: () => void;
  /** Says what is being left: "Leave lesson", "Leave test". */
  leaveLabel?: string;
};

/**
 * Replaces the masthead inside the daily session, series lessons and tests:
 * a close control, the name, and the theme button.
 */
export function SessionBar({ leaveHref = "/", onLeave, leaveLabel = "Leave lesson" }: SessionBarProps) {
  const content = (
    <>
      <CloseIcon size={20} className="md:h-[18px] md:w-[18px]" />
      <span className="sr-only md:not-sr-only">{leaveLabel}</span>
    </>
  );
  const classes =
    "inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-[10px] border-0 bg-transparent font-mono text-[14px] text-(--ink) no-underline hover:text-(--accent) md:justify-start";

  return (
    <header className="mx-auto grid max-w-[1296px] grid-cols-[1fr_auto_1fr] items-center gap-4 pt-[6px] md:py-4">
      <div className="flex justify-start">
        {onLeave ? (
          <button type="button" onClick={onLeave} className={classes}>
            {content}
          </button>
        ) : (
          <Link href={leaveHref} className={classes}>
            {content}
          </Link>
        )}
      </div>
      <p className="m-0 text-[19px] font-semibold tracking-[-0.01em] md:text-[22px] md:tracking-[-0.015em]">TopicTutor</p>
      <div className="flex justify-end">
        <ThemeButton />
      </div>
    </header>
  );
}
