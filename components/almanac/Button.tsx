import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "./cx";
import { ArrowIcon } from "./icons";

/** The vermilion block that follows text while it is being written. */
export function Caret({ className, inText = false }: { className?: string; inText?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block h-[17px] w-[7px] flex-none bg-(--accent)",
        // With reduced motion, written text appears a sentence at a time with no caret.
        inText && "almanac-text-caret ml-[3px] align-[-2px]",
        className
      )}
    />
  );
}

type ButtonProps = {
  /**
   * primary: the one filled button on a screen, and it is the next step.
   * outline: "Continue with Google" and a section's own action
   *   when the screen's primary is something else (Today's "Start a series").
   * quiet: the italic "or …" link for every other action.
   * danger: red outline, for the one action that deletes something. Only in a confirm step,
   *   next to a filled safe choice.
   * secondary is the old name for outline.
   */
  variant?: "primary" | "outline" | "quiet" | "secondary" | "danger";
  /** default is 58px tall. compact is 44px, for dialogs and tools. large is the old name for default. */
  size?: "default" | "compact" | "large";
  /** Shows the writing caret and blocks clicks. The label should say what is happening. */
  busy?: boolean;
  /** Dashed outline. The label must say why, for example "Pick an answer". */
  disabled?: boolean;
  /** Trailing arrow. */
  icon?: boolean;
  fullWidth?: boolean;
  /** Renders a link that looks like a button. */
  href?: string;
  /** Reaches the button element (not used for links). */
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "children">;

const solid =
  "inline-flex items-center justify-center gap-[14px] font-mono font-medium no-underline transition-colors duration-(--duration-instant) ease-out";

const sizes = {
  default: "min-h-(--button-h) px-[30px] text-[15px] leading-5",
  compact: "min-h-11 px-4 text-[13px] leading-5",
};

const variants = {
  primary: "border-[1.5px] border-(--ink) bg-(--ink) text-(--on-ink) hover:border-(--accent) hover:bg-(--accent)",
  outline: "border-[1.5px] border-(--ink) bg-transparent text-(--ink) hover:bg-(--paper-sunk)",
  danger:
    "border-[1.5px] border-(--danger) bg-transparent text-(--danger) hover:border-(--danger-hover) hover:bg-(--paper-sunk) hover:text-(--danger-hover)",
};

const quietLook =
  "inline-flex min-h-11 items-center bg-transparent p-0 border-0 font-serif text-[18px] italic text-(--ink-soft) underline decoration-1 underline-offset-[5px] transition-colors duration-(--duration-instant) ease-out hover:text-(--ink)";

const disabledLook =
  "cursor-not-allowed border-[1.5px] border-dashed border-(--ink-muted) bg-transparent text-(--ink-muted)";

export function Button({
  variant = "primary",
  size = "default",
  busy = false,
  disabled = false,
  icon = false,
  fullWidth = false,
  href,
  ref,
  className,
  children,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const kind = variant === "secondary" ? "outline" : variant;
  const quiet = kind === "quiet";
  const classes = cx(
    quiet
      ? cx(quietLook, disabled && "cursor-not-allowed no-underline text-(--ink-muted)")
      : cx(solid, sizes[size === "large" ? "default" : size], disabled ? disabledLook : variants[kind]),
    !disabled && (busy ? "cursor-progress" : "cursor-pointer"),
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {busy && <Caret className="h-4" />}
      {children}
      {icon && !busy && !disabled && <ArrowIcon />}
    </>
  );

  if (href && !disabled && !busy) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={busy ? undefined : onClick}
      {...rest}
    >
      {content}
    </button>
  );
}
