import Link from "next/link";
import { CloseIcon } from "./icons";
import { ThemeButton } from "./ThemeButton";

type SessionBarProps = {
  /** Where the close control goes. Use `onLeave` instead when leaving needs to do something first. */
  leaveHref?: string;
  onLeave?: () => void;
  /** Says what is being left: "Leave lesson", "Leave test", "Close". */
  leaveLabel?: string;
};

/**
 * Replaces the masthead inside the daily session, series lessons and tests:
 * a close control, the name, and the theme button.
 */
export function SessionBar({ leaveHref = "/", onLeave, leaveLabel = "Leave lesson" }: SessionBarProps) {
  const content = (
    <>
      <CloseIcon size={16} strokeWidth={1.8} />
      {leaveLabel}
    </>
  );
  const classes =
    "inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap border-0 bg-transparent p-0 font-mono text-[14px] text-(--ink) no-underline hover:text-(--accent)";

  return (
    <header className="mx-auto flex w-full max-w-(--content-max) items-center justify-between gap-3 pb-[10px] pt-2 md:pb-4 md:pt-5">
      <div className="flex flex-[1_1_0] justify-start">
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
      <p className="m-0 text-[22px] font-semibold tracking-[-0.015em] md:text-[28px]">TopicTutor</p>
      <div className="flex flex-[1_1_0] justify-end">
        <ThemeButton />
      </div>
    </header>
  );
}
