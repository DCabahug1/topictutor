"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body?: ReactNode;
  /** The destructive action, for example "Delete series". */
  confirmLabel: string;
  cancelLabel?: string;
  /** True while the action runs. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Asks before something is removed. A native modal dialog: focus is trapped,
 * it starts on the safe choice, and Escape cancels.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep it",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      keep.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={body ? `${id}-body` : undefined}
      onCancel={(event) => {
        // Escape: keep React in charge of the open state.
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onCancel();
      }}
      className="m-auto w-[min(440px,calc(100vw-32px))] border-[1.5px] border-solid border-(--ink) bg-(--paper-raised) p-0 text-(--ink) backdrop:bg-(--ink)/40"
    >
      <div className="p-6">
        <h2 id={`${id}-title`} className="m-0 text-[26px] font-medium leading-[1.12] tracking-[-0.015em]">
          {title}
        </h2>
        {body && (
          <p id={`${id}-body`} className="m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft)">
            {body}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {/* The safe choice is filled and has focus; the red outline is what deletes. */}
          <Button ref={keep} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
