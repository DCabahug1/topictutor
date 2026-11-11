"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { SubjectGrid, SubjectToggle } from "@/components/almanac/SubjectToggle";
import { SUBJECTS, almanac, useAlmanac, type Subject } from "@/lib/almanac";

// Shown once, after the first lesson. Subjects can be changed later in the profile.
export default function WelcomeSubjectsPage() {
  const user = useSession();
  const router = useRouter();
  const { data: session } = useAlmanac(() => almanac.getDailySession(), []);
  const { data: saved } = useAlmanac(() => almanac.getSubjects(), []);
  const [chosen, setChosen] = useState<Subject[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const picked = chosen ?? saved ?? [];
  const today = session?.lesson.subject;
  const tomorrow = picked.find((s) => s !== today) ?? picked[0];
  const streak = session?.streak.count ?? 0;

  const toggle = (subject: Subject) =>
    setChosen((previous) => {
      const current = previous ?? saved ?? [];
      return current.includes(subject) ? current.filter((s) => s !== subject) : [...current, subject];
    });

  const finish = async (subjects: Subject[]) => {
    setSaving(true);
    setFailed(false);
    try {
      await almanac.saveSubjects(subjects);
      // A guest is offered an account next. A signed-in learner goes back to Today.
      router.push(user ? "/today" : "/welcome/account");
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <PaperPage tabs={false}>
      <section className="mt-(--lead-top)">
        <LeadBlock
          eyebrow={session?.finishedAt ? `Lesson finished · day ${Math.max(streak, 1)}` : "Your subjects"}
          title="What should tomorrow be about?"
          line="Pick as many as you like. Your daily lesson rotates through them."
          className="max-w-[860px]"
        />

        <SubjectGrid label="Subjects" className="mt-12 md:mt-14">
          {SUBJECTS.map((subject) => (
            <SubjectToggle key={subject} name={subject} on={picked.includes(subject)} onToggle={() => toggle(subject)} />
          ))}
        </SubjectGrid>

        <div className="mt-8 flex flex-col gap-x-7 gap-y-5 md:flex-row md:flex-wrap md:items-center">
          <p role="status" className="m-0 text-[17px] italic text-(--ink-soft) md:mr-auto md:text-[18px]">
            {failed
              ? "Your subjects didn’t save. Try again."
              : picked.length
                ? `${picked.length} picked. Tomorrow starts with ${tomorrow}.`
                : "Pick at least one."}
          </p>
          {picked.length ? (
            <Button icon busy={saving} onClick={() => finish(picked)} className="max-md:w-full">
              Save subjects
            </Button>
          ) : (
            <Button disabled className="max-md:w-full">
              Pick at least one
            </Button>
          )}
          <Button variant="quiet" onClick={() => finish([])}>
            or skip for now
          </Button>
        </div>
      </section>
    </PaperPage>
  );
}
