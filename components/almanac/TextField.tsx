"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cx } from "./cx";
import { CrossIcon } from "./icons";

type TextFieldProps = {
  /** Always visible. For a read-only field, say why: "Email · can’t be changed". */
  label: string;
  /** Shown after submit, never while typing. */
  error?: string;
  help?: string;
  /** With maxLength, shows a counter such as "5 / 25". */
  maxLength?: number;
  /** Passwords: adds a Show / Hide toggle. */
  revealable?: boolean;
  /** boxed for forms, underlined for the landing topic field. */
  variant?: "boxed" | "underlined";
  value: string;
  onValueChange?: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "maxLength" | "className">;

export function TextField({
  label,
  error,
  help,
  maxLength,
  revealable = false,
  variant = "boxed",
  value,
  onValueChange,
  type = "text",
  readOnly,
  id: idProp,
  ...rest
}: TextFieldProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const [shown, setShown] = useState(false);
  const describedBy =
    [error && `${id}-error`, (help || maxLength) && `${id}-help`].filter(Boolean).join(" ") || undefined;
  const boxed = variant === "boxed";

  return (
    <div>
      <label htmlFor={id} className="block font-mono text-[12px] uppercase tracking-[0.08em] text-(--ink-muted)">
        {label}
      </label>
      <div
        className={cx(
          "mt-[10px] flex items-center",
          boxed && "border-solid bg-(--paper-raised)",
          boxed && !error && !readOnly && "border border-(--ink)",
          boxed && error && "border-2 border-(--incorrect)",
          boxed && readOnly && "border-[1.5px] border-dashed! border-(--ink-muted) bg-transparent!",
          !boxed && "border-0 border-b-[1.5px] border-solid",
          !boxed && (error ? "border-(--incorrect)" : "border-(--ink)")
        )}
      >
        <input
          id={id}
          type={revealable ? (shown ? "text" : "password") : type}
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          maxLength={maxLength}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "min-w-0 flex-auto rounded-none border-0 bg-transparent font-serif text-(--ink)",
            boxed ? "h-[54px] px-4 text-[19px]" : "h-12 px-[2px] text-[19px]",
            readOnly && "text-(--ink-muted)"
          )}
          {...rest}
        />
        {revealable && (
          <button
            type="button"
            aria-pressed={shown}
            onClick={() => setShown((s) => !s)}
            className="h-[54px] flex-none cursor-pointer border-0 bg-transparent px-4 font-mono text-[13px] text-(--ink-soft) hover:text-(--ink)"
          >
            {shown ? "Hide" : "Show"}
            <span className="sr-only"> password</span>
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-center gap-[6px] text-[15px] text-(--incorrect)">
          <CrossIcon size={14} className="flex-none" />
          {error}
        </p>
      )}
      {maxLength ? (
        <p id={`${id}-help`} className="mt-2 flex justify-between gap-3 font-mono text-[12px] text-(--ink-muted)">
          <span>{help}</span>
          <span>
            {value.length} / {maxLength}
          </span>
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="t-note mt-2 text-(--ink-muted)">
            {help}
          </p>
        )
      )}
    </div>
  );
}
