"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { CheckIcon, CrossIcon, GoogleIcon } from "@/components/almanac/icons";
import { authService } from "@/lib/auth";

// Shared by log in, register and password reset.

export const PASSWORD_MIN = 8;

const TITLE = "m-0 mt-[10px] text-[38px] font-medium leading-[1.04] tracking-[-0.02em] md:text-[46px]";
const INLINE_ACTION =
  "inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 font-mono text-[14px] text-(--ink) underline underline-offset-4";

/** What is wrong with an email, in plain words, or undefined when it looks right. */
export function emailProblem(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Enter your email.";
  const at = email.indexOf("@");
  if (at < 1 || at !== email.lastIndexOf("@") || /\s/.test(email)) {
    return "This doesn’t look like an email. It needs one @, like you@example.com.";
  }
  if (!/^[^.]+(\.[^.]+)+$/.test(email.slice(at + 1))) return "This email is missing its ending, like .com.";
  return undefined;
}

/** Moves to the first field with a problem, so the message is read out. */
export function focusField(id: string | undefined) {
  if (id) document.getElementById(id)?.focus();
}

export function FormHeader({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <>
      <p className="t-label m-0 text-(--accent)">{kicker}</p>
      <h1 className={TITLE}>{title}</h1>
      {lead && <p className="m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft)">{lead}</p>}
    </>
  );
}

/** Says why a submit didn't go through, above the form. Field messages carry the detail. */
export function FormAlert({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div
      role="alert"
      className="mb-[22px] border-0 border-t-[3px] border-solid border-(--incorrect) bg-(--incorrect-wash) px-4 py-[14px]"
    >
      <p className="t-label m-0 flex items-center gap-[6px] text-(--incorrect)">
        <CrossIcon size={12} strokeWidth={2.8} />
        {kicker}
      </p>
      <p className="m-0 mt-[6px] text-[17px] leading-[1.45]">{children}</p>
    </div>
  );
}

/** "Continue with Google" and the rule that separates it from the email form. */
export function GoogleSignIn({ fallback }: { fallback: string }) {
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    setFailed(false);
    setStarting(true);
    const result = await authService.signInWithGoogle().catch(() => ({ success: false }));
    // On success the browser is already leaving for Google.
    if (!result.success) {
      setFailed(true);
      setStarting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="large" fullWidth busy={starting} onClick={start} className="mt-6">
        {!starting && <GoogleIcon />}
        Continue with Google
      </Button>
      {failed && (
        <p role="alert" className="m-0 mt-2 flex items-start gap-[6px] text-[15px] leading-[1.4] text-(--incorrect)">
          <CrossIcon size={14} className="mt-[3px] flex-none" />
          Google sign-in didn’t start. Try again, or {fallback}.
        </p>
      )}
      <div
        aria-hidden="true"
        className="t-label mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 font-normal! text-(--ink-muted)"
      >
        <span className="h-px bg-(--rule)" />
        or with email
        <span className="h-px bg-(--rule)" />
      </div>
    </>
  );
}

/** The line under a form: "New here? Create an account". */
export function FootLine({ lead, label, href }: { lead: string; label: string; href: string }) {
  return (
    <p className="m-0 mt-2 text-[16px] text-(--ink-muted)">
      {lead}{" "}
      <Link href={href} className={INLINE_ACTION}>
        {label}
      </Link>
    </p>
  );
}

type MessageAction = { label: string; href?: string; onClick?: () => void; busy?: boolean };

type MessageStateProps = {
  icon: "mail" | "check" | "clock";
  /** done is a success, expired is a link that stopped working. The kicker says which in words. */
  tone?: "plain" | "done" | "expired";
  kicker: string;
  title: string;
  body: ReactNode;
  primary: MessageAction;
  secondary?: MessageAction & { lead: string };
  /** A line that appears after the secondary action, for example "Sent again." */
  status?: ReactNode;
};

/** The states that are a message, not a form: check your email, all set, link expired. */
export function MessageState({ icon, tone = "plain", kicker, title, body, primary, secondary, status }: MessageStateProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const ink = tone === "done" ? "text-(--correct)" : tone === "expired" ? "text-(--incorrect)" : "text-(--ink)";

  // These replace a form, so reading starts again from the title.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="almanac-rise">
      <div aria-hidden="true" className={cx("flex h-16 w-16 items-center justify-center border-[1.5px] border-solid border-current", ink)}>
        {icon === "check" ? <CheckIcon size={30} strokeWidth={2} /> : <LineIcon name={icon} />}
      </div>
      <p className={cx("t-label m-0 mt-5", ink)}>{kicker}</p>
      <h1 ref={heading} tabIndex={-1} className={cx(TITLE, "outline-none")}>
        {title}
      </h1>
      <p className="m-0 mt-3 text-[18px] leading-normal text-(--ink-soft)">{body}</p>
      <Button size="large" fullWidth href={primary.href} onClick={primary.onClick} busy={primary.busy} className="mt-6">
        {primary.label}
      </Button>
      {secondary && (
        <p className="m-0 mt-1 text-[16px] text-(--ink-muted)">
          {secondary.lead}{" "}
          {secondary.href ? (
            <Link href={secondary.href} className={INLINE_ACTION}>
              {secondary.label}
            </Link>
          ) : (
            <button type="button" onClick={secondary.onClick} disabled={secondary.busy} className={INLINE_ACTION}>
              {secondary.label}
            </button>
          )}
        </p>
      )}
      {/* Always mounted, so the line is announced when it arrives. */}
      <p role="status" className="t-note m-0 text-(--ink-muted)">
        {status}
      </p>
    </div>
  );
}

// The envelope and the clock, drawn like the shared icons: 24px grid, 1.5px stroke.
function LineIcon({ name }: { name: "mail" | "clock" }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "mail" ? (
        <>
          <path d="M3 6h18v12H3z" />
          <path d="M3 7l9 7 9-7" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
    </svg>
  );
}
