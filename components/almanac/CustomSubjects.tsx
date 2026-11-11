"use client";

import { useState, type KeyboardEvent } from "react";
import { CUSTOM_NAME_LIMIT, almanac, cleanCustomName, type TopicCheck } from "@/lib/almanac";
import { Button } from "./Button";
import { TextField } from "./TextField";
import { TopicReview } from "./TopicReview";

type Review = { check: TopicCheck; typed: string };

const FIELD_ID = "custom-subject";

/**
 * Adding a subject of the learner's own, read the way a series topic is before
 * it is added: a likely typo gets "Did you mean…", and something it can't read
 * or won't teach is explained. `onAdd` gets the name to keep.
 */
export function useSubjectAdder(onAdd: (name: string) => void) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const name = cleanCustomName(value);

  const change = (next: string) => {
    setValue(next);
    setReview(null);
  };

  const close = () => {
    setOpen(false);
    setValue("");
    setReview(null);
  };

  /** Keeps `topic` (a pick from the review, or what was typed) and closes the field. */
  const add = (topic: string) => {
    const kept = cleanCustomName(topic);
    onAdd(kept);
    close();
    return kept;
  };

  /**
   * Checks the typed name and adds it when it reads clearly. Resolves to the
   * name added, or null when there is nothing to add or the review needs a look.
   */
  const submit = async (): Promise<string | null> => {
    if (!name || checking) return null;
    // Already showing what the check made of this name.
    if (review?.typed === name) return null;
    setChecking(true);
    // If the check itself fails, the name goes through as typed.
    const check = await almanac.checkSubject(name).catch(() => null);
    setChecking(false);
    if (check && check.verdict !== "clear") {
      setReview({ check, typed: name });
      return null;
    }
    return add(check?.topic || name);
  };

  return { open, value, name, checking, review, setOpen, change, close, add, submit };
}

export type SubjectAdder = ReturnType<typeof useSubjectAdder>;

/** The field the Add tile opens, and the review when the name needs another look. */
export function SubjectAdderField({ adder, className }: { adder: SubjectAdder; className?: string }) {
  const editName = () => {
    adder.change(adder.value);
    const field = document.getElementById(FIELD_ID) as HTMLInputElement | null;
    field?.focus();
    field?.select();
  };

  // Enter adds, without submitting a form the picker sits in.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void adder.submit();
  };

  if (!adder.open) return null;
  return (
    <div className={className}>
      <div className="flex max-w-[720px] flex-col gap-x-5 gap-y-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-auto">
          <TextField
            id={FIELD_ID}
            label="Your own subject"
            help="One subject, like Astronomy or Chess openings."
            value={adder.value}
            onValueChange={adder.change}
            onKeyDown={onKeyDown}
            placeholder="Astronomy"
            autoComplete="off"
            autoFocus
            maxLength={CUSTOM_NAME_LIMIT}
          />
        </div>
        <div className="flex items-center gap-x-5 md:mt-[26px]">
          <Button
            icon
            busy={adder.checking}
            disabled={!adder.name || Boolean(adder.review)}
            onClick={() => void adder.submit()}
            className="max-md:flex-auto"
          >
            {adder.checking ? "Checking" : "Add subject"}
          </Button>
          <Button variant="quiet" disabled={adder.checking} onClick={adder.close}>
            or cancel
          </Button>
        </div>
      </div>
      {adder.review && (
        <TopicReview
          purpose="subject"
          check={adder.review.check}
          typed={adder.review.typed}
          starting={null}
          onUse={adder.add}
          onEdit={editName}
          className="mt-6"
        />
      )}
    </div>
  );
}
