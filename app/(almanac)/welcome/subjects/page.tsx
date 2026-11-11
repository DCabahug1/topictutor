"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/almanac/Button";
import { PaperPage, PinnedActions } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { StatusLabel } from "@/components/almanac/StatusLabel";
import { SubjectToggle } from "@/components/almanac/SubjectToggle";
import { SUBJECTS, almanac, useAlmanac, type Subject } from "@/lib/almanac";

// Shown once, after the first lesson. Subjects can be changed later in the profile.
export default function WelcomeSubjectsPage() {
  const user = useSession();
  const router = useRouter();
  const { data: session } = useAlmanac(() => almanac.getDailySession(), []);
  const { data: saved } = useAlmanac(() => almanac.getSubjects(), []);
  const [chosen, setChosen] = useState<Subject[] | null>(null);
  const [saving, setSaving] = useState(false);

  const picked = chosen ?? saved ?? [];
  const today = session?.lesson.subject;
  const tomorrow = picked.find((s) => s !== today) ?? picked[0];
  const streak = session?.streak.count ?? 0;

  const toggle = (subject: Subject) =>
    setChosen(picked.includes(subject) ? picked.filter((s) => s !== subject) : [...picked, subject]);

  const finish = async (subjects: Subject[]) => {
    setSaving(true);
    await almanac.saveSubjects(subjects);
    // A guest is offered an account next. A signed-in learner goes back to Today.
    router.push(user ? "/today" : "/welcome/account");
  };

  return (
    <PaperPage tabs={false}>
      <div className="mx-auto max-w-[980px] pb-40 pt-7 md:pb-0 md:pt-14">
        {session?.finishedAt ? (
          <StatusLabel status="done" label={`Lesson finished · day ${Math.max(streak, 1)}`} />
        ) : (
          <p className="t-label m-0 font-normal! text-(--accent)">Your subjects</p>
        )}
        <h1 className="m-0 mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.02em] md:mt-[14px] md:text-[clamp(40px,4.6vw,64px)] md:leading-none md:tracking-[-0.025em]">
          What should tomorrow be about?
        </h1>
        <p className="m-0 mt-[10px] max-w-[680px] text-[17px] leading-normal text-(--ink-soft) md:mt-[14px] md:text-[20px]">
          Your daily lesson rotates through the subjects you pick. Pick as many as you like. You can change them
          any time in your profile.
        </p>

        <div
          role="group"
          aria-label="Subjects"
          className="mt-[22px] grid grid-cols-2 gap-2 md:mt-8 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-[10px]"
        >
          {SUBJECTS.map((subject) => (
            <SubjectToggle key={subject} name={subject} on={picked.includes(subject)} onToggle={() => toggle(subject)} />
          ))}
        </div>

        <PinnedActions
          note={
            <p role="status" className="m-0">
              {picked.length
                ? `${picked.length} picked. Tomorrow starts with ${tomorrow}.`
                : today
                  ? `Today was ${today}. Pick as many as you like.`
                  : "Pick as many as you like."}
            </p>
          }
        >
          <Button variant="quiet" size="compact" className="text-[14px]! md:min-h-[54px]" onClick={() => finish([])}>
            Skip for now
          </Button>
          {picked.length ? (
            <Button size="large" icon busy={saving} onClick={() => finish(picked)}>
              Save subjects
            </Button>
          ) : (
            <Button size="large" disabled>
              Pick at least one
            </Button>
          )}
        </PinnedActions>
      </div>
    </PaperPage>
  );
}
