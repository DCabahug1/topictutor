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
  variant?: "primary" | "secondary" | "quiet";
  /** default is 52px tall, compact 44px for toolbars, large 56px for the main action of a page. */
  size?: "default" | "compact" | "large";
  /** Shows the writing caret and blocks clicks. The label should say what is happening. */
  busy?: boolean;
  /** Dashed outline. The label must say why, for example "Submit · answer 2 more". */
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

const base =
  "inline-flex items-center justify-center gap-3 font-mono font-medium no-underline transition-colors duration-(--duration-instant) ease-out";

const sizes = {
  default: "min-h-[52px] px-6 text-[15px] leading-5",
  compact: "min-h-11 px-4 text-[13px] leading-5",
  large: "min-h-14 px-[26px] text-[15px] leading-5",
};

const variants = {
  primary:
    "border-[1.5px] border-(--ink) bg-(--ink) text-(--on-ink) hover:border-(--accent) hover:bg-(--accent)",
  secondary: "border-[1.5px] border-(--ink) bg-transparent text-(--ink) hover:bg-(--paper-sunk)",
  quiet: "border-0 bg-transparent px-2! text-(--ink) underline decoration-1 underline-offset-4",
};

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
  const classes = cx(
    base,
    sizes[size],
    disabled ? disabledLook : variants[variant],
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
