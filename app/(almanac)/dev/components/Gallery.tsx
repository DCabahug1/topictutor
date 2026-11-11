"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AskBox } from "@/components/almanac/AskBox";
import { Button } from "@/components/almanac/Button";
import { ConfirmDialog } from "@/components/almanac/ConfirmDialog";
import { LessonBody } from "@/components/almanac/LessonBody";
import { BottomTabs, Masthead } from "@/components/almanac/Masthead";
import { Notice } from "@/components/almanac/Notice";
import { Question, type Answer } from "@/components/almanac/Question";
import { QuestionNav } from "@/components/almanac/QuestionNav";
import { SessionBar } from "@/components/almanac/SessionBar";
import { SessionProgress } from "@/components/almanac/SessionProgress";
import type { SessionUser } from "@/components/almanac/SessionProvider";
import { ProgressMeter, StatusLabel } from "@/components/almanac/StatusLabel";
import { StreakMark } from "@/components/almanac/StreakMark";
import { SubjectToggle } from "@/components/almanac/SubjectToggle";
import { TextField } from "@/components/almanac/TextField";
import { ThemeButton } from "@/components/almanac/ThemeButton";
import { FORCE_FLAGS, almanac, lastSevenDays, localDate, shiftDate, type ForceFlag } from "@/lib/almanac";
import { getForced, resetFixture, setForced, subscribeForced } from "@/lib/almanac/fixture-source";
import { DAILY } from "@/lib/almanac/fixtures/content";

const DUANE: SessionUser = {
  id: "dev",
  email: "duane@example.com",
  name: "Duane Cabahug",
  imageUrl: null,
  profileId: null,
};

/** Renders the same content twice: once in each theme. */
function Both({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-px bg-(--rule) lg:grid-cols-2">
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} className="min-w-0 bg-(--paper) p-6 text-(--ink)">
          {children}
        </div>
      ))}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="t-title m-0">{title}</h2>
      {note && <p className="t-note m-0 mt-1 text-(--ink-muted)">{note}</p>}
      <div className="mt-4 border border-solid border-(--rule)">{children}</div>
    </section>
  );
}

function State({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <p className="t-label m-0 mb-3 text-(--ink-muted)">{name}</p>
      {children}
    </div>
  );
}

function Questions() {
  const [instant, setInstant] = useState<Answer | null>(null);
  const [deferred, setDeferred] = useState<Answer | null>(1);
  const leap = DAILY.check[1];
  return (
    <>
      <State name="Instant · unanswered, then revealed on select (A to D, arrows, Space)">
        <Question
          label={leap.prompt}
          options={leap.options}
          value={instant}
          onChange={setInstant}
          mode="instant"
          correctIndex={leap.correctIndex}
          explanation={leap.explanation}
        />
        <Button variant="quiet" size="compact" className="mt-2" onClick={() => setInstant(null)}>
          Clear the answer
        </Button>
      </State>
      <State name="Deferred · selected, with Not sure (N)">
        <Question
          label={leap.prompt}
          options={leap.options}
          value={deferred}
          onChange={setDeferred}
          mode="deferred"
          allowUnsure
        />
      </State>
      <State name="Deferred · revealed, wrong answer">
        <Question
          label={leap.prompt}
          options={leap.options}
          value={2}
          onChange={() => {}}
          mode="deferred"
          revealed
          correctIndex={leap.correctIndex}
          explanation={leap.explanation}
          allowUnsure
        />
      </State>
      <State name="Deferred · revealed, correct answer">
        <Question
          label={leap.prompt}
          options={leap.options}
          value={3}
          onChange={() => {}}
          mode="deferred"
          revealed
          correctIndex={leap.correctIndex}
          explanation={leap.explanation}
        />
      </State>
    </>
  );
}

function Fields() {
  const [name, setName] = useState("Duane");
  const [password, setPassword] = useState("hunter22");
  const [topic, setTopic] = useState("");
  return (
    <div className="grid gap-7 sm:grid-cols-2">
      <TextField label="Email" type="email" value="duane@example.com" onValueChange={() => {}} />
      <TextField
        label="Password"
        revealable
        value={password}
        onValueChange={setPassword}
        error="That password doesn’t match this email."
      />
      <TextField label="Email · can’t be changed" value="duane@example.com" readOnly />
      <TextField label="Name" value={name} onValueChange={setName} maxLength={25} help="Shown on your profile" />
      <TextField
        label="What do you want to learn?"
        variant="underlined"
        value={topic}
        onValueChange={setTopic}
        placeholder="Basics of web development"
        help="Placeholders are examples, never instructions."
      />
    </div>
  );
}

function Subjects() {
  const [picked, setPicked] = useState<string[]>(["Science"]);
  return (
    <div role="group" aria-label="Subjects" className="grid max-w-[420px] grid-cols-2 gap-2">
      {["Math", "Science", "Technology", "Health and Wellness"].map((name) => (
        <SubjectToggle
          key={name}
          name={name}
          on={picked.includes(name)}
          onToggle={() => setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]))}
        />
      ))}
    </div>
  );
}

function QuestionNavs() {
  const [current, setCurrent] = useState(2);
  const answered = [true, true, false, false, false];
  return (
    <>
      <State name="Row · phones">
        <QuestionNav count={5} current={current} answered={answered} onJump={setCurrent} className="max-w-[340px]" />
      </State>
      <State name="List · desktop, with difficulty">
        <QuestionNav
          variant="list"
          count={5}
          current={current}
          answered={answered}
          onJump={setCurrent}
          meta={["Easy", "Easy", "Hard", "Medium", "Hard"]}
          className="max-w-[380px]"
        />
      </State>
    </>
  );
}

function Dialogs() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete series
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this series?"
        body="Its lessons, your answers and your Mastery Check score go with it. This can’t be undone."
        confirmLabel="Delete series"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

function SampleData() {
  const stored = useSyncExternalStore(
    subscribeForced,
    () => getForced().join(","),
    () => ""
  );
  const flags = (stored ? stored.split(",") : []) as ForceFlag[];
  const [message, setMessage] = useState("");

  const toggle = (flag: ForceFlag) => {
    setForced(flags.includes(flag) ? flags.filter((f) => f !== flag) : [...flags, flag]);
  };
  const reset = (seed: "new" | "established") => {
    resetFixture(seed);
    setMessage(
      seed === "new"
        ? "Cleared. Signed-in learners now start with no history."
        : "Cleared. Signed-in learners now start twelve days into a streak with six series."
    );
  };

  return (
    <div className="p-6">
      <p className="m-0 max-w-[720px] text-[17px] leading-normal text-(--ink-soft)">
        These switches only affect the sample data layer in this browser. Turn one on, then open the screen it
        affects.
      </p>
      <div role="group" aria-label="Forced states" className="mt-4 flex flex-wrap gap-2">
        {FORCE_FLAGS.map((flag) => (
          <button
            key={flag}
            type="button"
            aria-pressed={flags.includes(flag)}
            onClick={() => toggle(flag)}
            className={`min-h-11 cursor-pointer border-[1.5px] border-solid border-(--ink) px-3 font-mono text-[13px] ${
              flags.includes(flag) ? "bg-(--ink) text-(--on-ink)" : "bg-transparent text-(--ink)"
            }`}
          >
            {flag}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="compact" variant="secondary" onClick={() => reset("established")}>
          Reset · returning learner
        </Button>
        <Button size="compact" variant="secondary" onClick={() => reset("new")}>
          Reset · new learner
        </Button>
      </div>
      <p role="status" className="t-note m-0 mt-3 text-(--ink-muted)">
        {message}
      </p>
    </div>
  );
}

export function Gallery() {
  const today = localDate();
  const sixDone = lastSevenDays(
    Array.from({ length: 6 }, (_, i) => shiftDate(today, -(i + 1))),
    today
  );
  const allDone = lastSevenDays(
    Array.from({ length: 7 }, (_, i) => shiftDate(today, -i)),
    today
  );

  return (
    <div className="mx-auto max-w-[1296px] px-6 pb-24">
      <header className="flex items-center justify-between gap-4 pt-6">
        <div>
          <p className="t-label m-0 text-(--accent)">Development only</p>
          <h1 className="t-title-lg m-0 mt-2">Almanac components</h1>
        </div>
        <ThemeButton />
      </header>

      <Section title="Sample data" note="Force failures and limits, or start over.">
        <SampleData />
      </Section>

      <Section title="Button" note="One primary per view. Disabled says why. Busy shows the caret.">
        <Both>
          <div className="flex flex-wrap items-center gap-4">
            <Button icon>Start today’s lesson</Button>
            <Button variant="secondary">Go deeper</Button>
            <Button variant="quiet">Stop for today</Button>
            <Button disabled>Submit · 3 of 5 answered</Button>
            <Button variant="secondary" busy>
              Writing your outline
            </Button>
            <Button size="compact" variant="secondary">
              Compact
            </Button>
            <Button size="large" href="#" icon>
              Link as a button
            </Button>
          </div>
        </Both>
      </Section>

      <Section title="Question and AnswerOption">
        <Both>
          <Questions />
        </Both>
      </Section>

      <Section title="QuestionNav" note="Tests only.">
        <Both>
          <QuestionNavs />
        </Both>
      </Section>

      <Section title="SessionProgress">
        <Both>
          <State name="Returning learner, on the lesson">
            <SessionProgress current="lesson" hasRecall />
          </State>
          <State name="First visit, no history to recall">
            <SessionProgress current="lesson" hasRecall={false} />
          </State>
          <State name="Finish">
            <SessionProgress current="finish" hasRecall />
          </State>
        </Both>
      </Section>

      <Section title="LessonBody">
        <Both>
          <State name="Writing">
            <LessonBody dropCap streaming paragraphs={[DAILY.paragraphs[0], DAILY.paragraphs[1].slice(0, 96)]} />
          </State>
          <State name="Written">
            <LessonBody dropCap paragraphs={DAILY.paragraphs} />
          </State>
        </Both>
      </Section>

      <Section title="AskBox" note="Type a question to see answering and answered. Turn on askFail above for failed.">
        <Both>
          <AskBox
            lessonId="dev"
            hint={DAILY.askHint}
            onAsk={(question) => almanac.askTutor({ kind: "daily" }, question)}
            onExplainDifferently={() => almanac.askTutor({ kind: "daily" }, null)}
          />
        </Both>
      </Section>

      <Section title="TextField">
        <Both>
          <Fields />
        </Both>
      </Section>

      <Section title="StatusLabel and ProgressMeter">
        <Both>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <StatusLabel status="notStarted" />
            <StatusLabel status="inProgress" />
            <StatusLabel status="completed" />
            <StatusLabel status="done" label="Lesson done" />
          </div>
          <div className="mt-7 flex max-w-[420px] flex-col gap-5">
            <ProgressMeter lessonsDone={0} passed={false} caption />
            <ProgressMeter lessonsDone={2} passed={false} caption />
            <ProgressMeter lessonsDone={5} passed={false} caption />
            <ProgressMeter lessonsDone={5} passed caption />
          </div>
        </Both>
      </Section>

      <Section title="StreakMark">
        <Both>
          <div className="grid gap-8 sm:grid-cols-3">
            <State name="Not yet today">
              <StreakMark count={12} week={sixDone} todayDone={false} />
            </State>
            <State name="Done today">
              <StreakMark count={13} week={allDone} todayDone note="Tomorrow: History." />
            </State>
            <State name="Zero">
              <StreakMark count={0} todayDone={false} />
            </State>
          </div>
          <div className="mt-6 flex items-end gap-8">
            <State name="Medium">
              <StreakMark size="md" count={12} todayDone={false} />
            </State>
            <State name="Small">
              <StreakMark size="sm" count={12} todayDone={false} />
            </State>
          </div>
        </Both>
      </Section>

      <Section title="Masthead" note="The account menu opens on click. Escape closes it.">
        <Both>
          <State name="Signed out">
            <Masthead user={null} guestStreak={0} />
          </State>
          <State name="Guest with progress">
            <Masthead user={null} guestStreak={1} />
          </State>
          <State name="Signed in, with the date line">
            <Masthead user={DUANE} current="today" dateline />
          </State>
        </Both>
      </Section>

      <Section title="SessionBar">
        <Both>
          <SessionBar leaveHref="#" />
        </Both>
      </Section>

      <Section title="BottomTabs" note="Fixed to the bottom of the screen below 768px. Narrow the window to see it.">
        <div className="p-6">
          <BottomTabs current="today" />
          <p className="m-0 text-[17px] text-(--ink-soft)">Today, Library and Stats. The current tab has a 3px accent top border.</p>
        </div>
      </Section>

      <Section title="Notice">
        <Both>
          <div className="grid gap-6 xl:grid-cols-3">
            <Notice
              tone="error"
              kicker="Didn’t finish writing"
              title="Your placement test didn’t come through."
              kept="Nothing was lost."
              body="Try again, or come back to it from your Library."
              primary={{ label: "Try again", onClick: () => {} }}
              secondary={{ label: "Back to Library", href: "#" }}
            />
            <Notice
              tone="info"
              kicker="Daily limit reached"
              title="New series are paused for guests today."
              body="Open the sample series to see how one works, or create a free account to make your own."
              primary={{ label: "Open the sample series", href: "#" }}
              secondary={{ label: "Create account", href: "#" }}
            />
            <Notice
              tone="info"
              kicker="Not found"
              title="This series isn’t here."
              body="It may have been deleted, or the link is from another account."
              primary={{ label: "Go to Library", href: "#" }}
            />
          </div>
        </Both>
      </Section>

      <Section title="SubjectToggle">
        <Both>
          <Subjects />
        </Both>
      </Section>

      <Section title="ConfirmDialog" note="Focus starts on Keep it. Escape cancels.">
        <div className="p-6">
          <Dialogs />
        </div>
      </Section>
    </div>
  );
}
