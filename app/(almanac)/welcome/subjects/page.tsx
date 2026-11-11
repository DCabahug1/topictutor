"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/almanac/Button";
import { SubjectAdderField, useSubjectAdder } from "@/components/almanac/CustomSubjects";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { AddSubjectTile, SubjectGrid, SubjectToggle } from "@/components/almanac/SubjectToggle";
import {
  CUSTOM_LIMIT,
  FIXED_SUBJECTS,
  addCustom,
  almanac,
  subjectNames,
  useAlmanac,
  type CustomSubject,
  type Subject,
} from "@/lib/almanac";

// Shown once, after the first lesson. Subjects can be changed later in the profile.
export default function WelcomeSubjectsPage() {
  const user = useSession();
  const router = useRouter();
  const { data: session } = useAlmanac(() => almanac.getDailySession(), []);
  const { data: saved } = useAlmanac(() => almanac.getSubjects(), []);
  // Null until changed here, so the picker starts from what's saved.
  const [chosen, setChosen] = useState<Subject[] | null>(null);
  const [customChosen, setCustomChosen] = useState<CustomSubject[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const picked = chosen ?? saved?.subjects ?? [];
  const custom = customChosen ?? saved?.custom ?? [];
  const adder = useSubjectAdder((name) => setCustomChosen(addCustom(custom, name)));

  const names = subjectNames({ subjects: picked, custom });
  const today = session?.lesson.subjectName;
  const tomorrow = names.find((s) => s !== today) ?? names[0];
  const streak = session?.streak.count ?? 0;
  const busy = saving || adder.checking;

  const toggle = (subject: Subject) =>
    setChosen(picked.includes(subject) ? picked.filter((s) => s !== subject) : [...picked, subject]);
  const toggleCustom = (index: number) =>
    setCustomChosen(custom.map((c, i) => (i === index ? { ...c, on: !c.on } : c)));
  const removeCustom = (index: number) => setCustomChosen(custom.filter((_, i) => i !== index));

  const finish = async (subjects: Subject[], list: CustomSubject[] | null) => {
    setSaving(true);
    setFailed(false);
    try {
      await almanac.saveSubjects(subjects, list);
      // A guest is offered an account next. A signed-in learner goes back to Today.
      router.push(user ? "/today" : "/welcome/account");
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  /** Saves the picks, adding a name still in the field first (after its check). */
  const savePicks = async () => {
    if (busy) return;
    let list = custom;
    if (adder.name) {
      const added = await adder.submit();
      if (!added) return;
      list = addCustom(custom, added);
    }
    await finish(picked, list);
  };

  const pending = adder.open && adder.name !== "";
  const count = names.length + (pending && !adder.review ? 1 : 0);
  const status = failed
    ? "Your subjects didn’t save. Try again."
    : adder.checking
      ? "Checking your subject."
      : adder.review
        ? "Pick an option above, or change the subject."
        : count
          ? names.length
            ? `${count} picked. Tomorrow starts with ${tomorrow}.`
            : `1 picked. Tomorrow starts with ${adder.name}.`
          : "Pick at least one.";

  return (
    <PaperPage tabs={false}>
      <section className="mt-(--lead-top)">
        <LeadBlock
          eyebrow={session?.finishedAt ? `Lesson finished · day ${Math.max(streak, 1)}` : "Your subjects"}
          title="What should tomorrow be about?"
          line="Pick as many as you like, or add your own. Your daily lesson rotates through them."
          className="max-w-[860px]"
        />

        <SubjectGrid label="Subjects" className="mt-12 md:mt-14">
          {FIXED_SUBJECTS.map((subject) => (
            <SubjectToggle key={subject} name={subject} on={picked.includes(subject)} onToggle={() => toggle(subject)} />
          ))}
          {custom.map((c, i) => (
            <SubjectToggle
              key={c.name}
              name={c.name}
              on={c.on}
              onToggle={() => toggleCustom(i)}
              onRemove={() => removeCustom(i)}
            />
          ))}
          <AddSubjectTile
            open={adder.open}
            full={custom.length >= CUSTOM_LIMIT}
            count={`${custom.length} of ${CUSTOM_LIMIT}`}
            onClick={() => adder.setOpen(true)}
          />
        </SubjectGrid>

        <SubjectAdderField adder={adder} className="mt-8" />

        <div className="mt-8 flex flex-col gap-x-7 gap-y-5 md:flex-row md:flex-wrap md:items-center">
          <p role="status" className="m-0 text-[17px] italic text-(--ink-soft) md:mr-auto md:text-[18px]">
            {status}
          </p>
          {!count ? (
            <Button disabled className="max-md:w-full">
              Pick at least one
            </Button>
          ) : adder.review ? (
            // The review holds the choices until the name is changed.
            <Button disabled className="max-md:w-full">
              Save subjects
            </Button>
          ) : (
            <Button icon busy={busy} onClick={savePicks} className="max-md:w-full">
              {adder.checking ? "Checking your subject" : "Save subjects"}
            </Button>
          )}
          <Button variant="quiet" disabled={busy} onClick={() => finish([], null)}>
            or skip for now
          </Button>
        </div>
      </section>
    </PaperPage>
  );
}
