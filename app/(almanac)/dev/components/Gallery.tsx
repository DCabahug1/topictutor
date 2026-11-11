"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AskBox } from "@/components/almanac/AskBox";
import { Button } from "@/components/almanac/Button";
import { ConfirmDialog } from "@/components/almanac/ConfirmDialog";
import { FilterTabs } from "@/components/almanac/FilterTabs";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { ProgressMeter } from "@/components/almanac/ProgressMeter";
import { StepMeter } from "@/components/almanac/StepMeter";
import { LessonBody } from "@/components/almanac/LessonBody";
import { LessonRow } from "@/components/almanac/LessonRow";
import { Markdown } from "@/components/almanac/Markdown";
import { BottomTabs, Masthead } from "@/components/almanac/Masthead";
import { Notice } from "@/components/almanac/Notice";
import { Question, type Answer } from "@/components/almanac/Question";
import { SessionBar } from "@/components/almanac/SessionBar";
import { SeriesRow } from "@/components/almanac/SeriesRow";
import type { SessionUser } from "@/components/almanac/SessionProvider";
import { StatBars } from "@/components/almanac/StatBars";
import { StreakMark } from "@/components/almanac/StreakMark";
import { SubjectGrid, SubjectToggle } from "@/components/almanac/SubjectToggle";
import { TextField } from "@/components/almanac/TextField";
import { ThemeButton } from "@/components/almanac/ThemeButton";
import {
  FORCE_FLAGS,
  almanac,
  lastSevenDays,
  localDate,
  shiftDate,
  type ForceFlag,
  type SeriesSummary,
  type TopicCheck,
} from "@/lib/almanac";
import { getForced, resetFixture, setForced, subscribeForced } from "@/lib/almanac/fixture-source";
import { DAILY } from "@/lib/almanac/fixtures/content";
import { QUESTION_HEADING } from "../../series/new/components/parts";
import { TopicReview } from "../../series/new/components/TopicReview";

const WEB_SERIES: SeriesSummary = {
  id: "web",
  title: "How a Web Page Gets Built: HTML, CSS and the Browser",
  category: "Technology",
  description: "From the request your browser sends to the styled page on screen.",
  status: "inProgress",
  lessonsDone: 2,
  masteryPassed: false,
  masteryBest: null,
  percent: 33,
  updatedAt: new Date().toISOString(),
  isSample: false,
  nextLesson: { number: 3, title: "How the browser decides which CSS rule wins" },
};

/** The three ways the topic check can stop a learner, as the server returns them. */
const TOPIC_REVIEWS: Array<{ name: string; typed: string; check: TopicCheck }> = [
  {
    name: "Suggest · a likely typo",
    typed: "photosinthesis",
    check: { verdict: "suggest", topic: "Photosynthesis", note: "That looks like a typo.", suggestions: ["How plants make food from light"] },
  },
  {
    name: "Unclear · nothing to teach",
    typed: "asdkj qwe zz",
    check: { verdict: "unclear", topic: "", note: "We couldn’t find a subject in that.", suggestions: [] },
  },
  {
    name: "Refused · with safe angles",
    typed: "how to hack my ex’s email",
    check: {
      verdict: "refused",
      topic: "",
      note: "We can’t help with getting into someone else’s account.",
      suggestions: ["How email security works", "Protecting your own accounts"],
    },
  },
];

/** A question about code, written the way the prompts now ask for it. */
const CODE_QUESTION = {
  prompt:
    "What does this print?\n\n```python\ndef add(x, items=[]):\n    items.append(x)\n    return items\n\nprint(add(1), add(2))\n```",
  options: ["`[1] [2]`", "`[1, 2] [1, 2]`", "`[1] [1, 2]`", "It raises a `TypeError`"],
  correctIndex: 1,
  explanation:
    "The default list is made once, when `def` runs, so both calls append to the same list and print it twice after both calls.",
};

/** Everything the writer and the tutor may use, in one lesson. */
const MARKDOWN_SAMPLE = [
  "**Specificity** decides which CSS rule wins when two rules target the same element. Higher specificity wins, whatever the order.",
  "It is counted in three parts:\n\n1. IDs, like `#nav`\n2. Classes and attributes, like `.button`\n3. Element names, like `p`",
  "| Selector | IDs | Classes | Elements |\n| --- | --- | --- | --- |\n| `p` | 0 | 0 | 1 |\n| `.note p` | 0 | 1 | 1 |\n| `#main .note` | 1 | 1 | 0 |",
  "> A tie goes to whichever rule comes last.\n\n```css\n.note { color: gray; }\n.note { color: black; } /* this one wins */\n```\n\nSee [MDN on specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) for the full rules.",
];

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
  const [codeAnswer, setCodeAnswer] = useState<Answer | null>(null);
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
          pageShortcuts={false}
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
          pageShortcuts={false}
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
          pageShortcuts={false}
          revealed
          correctIndex={leap.correctIndex}
          explanation={leap.explanation}
          allowUnsure
        />
      </State>
      <State name="Code · a fenced prompt, inline-code options, revealed">
        <h1 className={QUESTION_HEADING}>
          <Markdown mode="inline">{CODE_QUESTION.prompt}</Markdown>
        </h1>
        <Question
          className="mt-8"
          label={CODE_QUESTION.prompt}
          options={CODE_QUESTION.options}
          value={codeAnswer}
          onChange={setCodeAnswer}
          mode="instant"
          pageShortcuts={false}
          correctIndex={CODE_QUESTION.correctIndex}
          explanation={CODE_QUESTION.explanation}
          allowUnsure
        />
      </State>
      <State name="Code · an older question with its fence on one line">
        <h1 className={QUESTION_HEADING}>
          <Markdown mode="inline">{"What does the code print? ```python print(isinstance(True, int)) print(True + 1) ```"}</Markdown>
        </h1>
      </State>
      <State name="Deferred · revealed, correct answer">
        <Question
          label={leap.prompt}
          options={leap.options}
          value={3}
          onChange={() => {}}
          mode="deferred"
          pageShortcuts={false}
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
    <SubjectGrid label="Subjects">
      {["Math", "Science", "Technology", "Health and Wellness"].map((name) => (
        <SubjectToggle
          key={name}
          name={name}
          on={picked.includes(name)}
          onToggle={() => setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]))}
        />
      ))}
    </SubjectGrid>
  );
}

function Filters() {
  const [value, setValue] = useState<"all" | "inProgress" | "notStarted" | "done">("all");
  return (
    <FilterTabs
      label="Show series"
      value={value}
      onChange={setValue}
      tabs={[
        { value: "all", label: "All", count: 6 },
        { value: "inProgress", label: "In progress", count: 3 },
        { value: "notStarted", label: "Not started", count: 1 },
        { value: "done", label: "Done", count: 2 },
      ]}
    />
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
            className={`min-h-11 cursor-pointer border border-solid border-(--ink) px-3 font-mono text-[13px] ${
              flags.includes(flag)
                ? "border-t-4 border-t-(--accent) bg-(--paper-raised) text-(--ink)"
                : "bg-transparent text-(--ink-muted)"
            }`}
          >
            {flags.includes(flag) ? `✓ ${flag}` : flag}
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

      <Section title="LeadBlock" note="Every screen opens with one: eyebrow, heading, one sentence, one button.">
        <Both>
          <State name="Large, with a quiet link">
            <LeadBlock
              eyebrow="Good evening, Duane · Today in Science"
              title="Why leap years exist"
              line="One question from Monday, a short lesson, then a quick check. About three minutes."
              primary={
                <Button href="#" icon>
                  Start today’s lesson
                </Button>
              }
              quiet={
                <Button variant="quiet" href="#">
                  or read it again
                </Button>
              }
            />
          </State>
          <State name="Small, with a numeral and a meter">
            <LeadBlock
              size="sm"
              numeral={<p className="m-0 font-serif text-[96px] font-medium leading-[0.8] tracking-[-0.04em]">3/5</p>}
              eyebrow="Technology · in progress"
              title="How a Web Page Gets Built"
              line="Up next is lesson 3, on which CSS rule wins."
              primary={
                <Button href="#" icon>
                  Continue with lesson 3
                </Button>
              }
            >
              <ProgressMeter lessonsDone={2} />
            </LeadBlock>
          </State>
        </Both>
      </Section>

      <Section title="Button" note="One primary per screen. Outline only for Google and dialogs. Everything else is quiet.">
        <Both>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <Button icon>Start today’s lesson</Button>
            <Button variant="quiet">or stop for today</Button>
            <Button variant="outline">Continue with Google</Button>
            <Button disabled>Pick an answer</Button>
            <Button busy>Writing the lesson</Button>
            <Button size="compact" variant="outline">
              Keep it
            </Button>
          </div>
        </Both>
      </Section>

      <Section title="StepMeter" note="Daily session, placement test and Mastery Check. The line carries the progress.">
        <Both>
          <State name="Returning learner, on the lesson">
            <StepMeter steps={4} current={1} label="Lesson · step 2 of 4" />
          </State>
          <State name="Placement test, question 3 of 5">
            <StepMeter steps={5} current={2} label="Question 3 of 5" />
          </State>
        </Both>
      </Section>

      <Section title="ProgressMeter" note="Five segments plus text. The Mastery Check is its own row, not a sixth cell.">
        <Both>
          <div className="flex flex-col gap-5">
            <ProgressMeter lessonsDone={0} />
            <ProgressMeter lessonsDone={2} />
            <ProgressMeter lessonsDone={5} />
            <ProgressMeter size="sm" lessonsDone={3} label="Lesson 4 of 5" />
          </div>
        </Both>
      </Section>

      <Section title="FilterTabs">
        <Both>
          <Filters />
        </Both>
      </Section>

      <Section title="Question and AnswerOption">
        <Both>
          <Questions />
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
          <State name="Markdown">
            <LessonBody dropCap paragraphs={MARKDOWN_SAMPLE} />
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

      <Section title="StreakMark">
        <Both>
          <div className="grid gap-8 sm:grid-cols-3">
            <State name="Not yet today">
              <StreakMark count={12} week={sixDone} todayDone={false} />
            </State>
            <State name="Finish · celebrate">
              <StreakMark count={13} week={allDone} todayDone celebrate note="Tomorrow: History." />
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
            <Masthead user={null} />
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

      <Section title="SeriesRow" note="Today and Library. Titles wrap and are never cut short.">
        <Both>
          <State name="Series first (Library)">
            <SeriesRow series={WEB_SERIES} href="#" />
          </State>
          <State name="Next lesson first">
            <SeriesRow series={WEB_SERIES} lead="nextLesson" href="#" />
          </State>
        </Both>
      </Section>

      <Section title="LessonRow" note="The why line turns accent when the lesson is there because a test question was missed.">
        <Both>
          <LessonRow
            number={2}
            title="HTML gives a page its structure"
            description="Elements, nesting, and why the right tag matters."
            why="A quick refresher. You got question 2 right."
            focus={false}
            status="done"
            href="#"
          />
          <LessonRow
            number={3}
            title="How the browser decides which CSS rule wins"
            description="Specificity, order, and the cascade."
            why="Here because you missed question 3, on which CSS rule wins."
            focus
            status="upNext"
            href="#"
          />
          <LessonRow
            number={4}
            title="Boxes, flow and layout"
            description="The box model and how elements take up space."
            why="A quick refresher. You got question 4 right."
            focus={false}
            status="notStarted"
            href="#"
          />
          <LessonRow
            marker="◇"
            title="Mastery Check"
            sub="Opens when every lesson check is answered."
            tag="5 questions · pass with 4"
            status="notStarted"
            muted
          />
        </Both>
      </Section>

      <Section title="StatBars" note="Every number is printed, and the whole chart is one labelled image.">
        <Both>
          <State name="Columns · lessons per day">
            <StatBars
              title="Lessons finished"
              layout="columns"
              bars={sixDone.map((day, i) => ({
                label: day.isToday ? "Today" : day.short,
                spoken: day.name,
                value: [1, 1, 2, 1, 1, 3, 0][i],
                current: day.isToday,
              }))}
              className="max-w-[420px]"
            />
          </State>
          <State name="Rows · by subject">
            <StatBars
              title="Lessons by subject"
              layout="rows"
              bars={[
                { label: "Science", value: 31 },
                { label: "History", value: 28 },
                { label: "Health and Wellness", value: 13 },
              ]}
              className="max-w-[520px]"
            />
          </State>
        </Both>
      </Section>

      <Section title="SubjectToggle">
        <Both>
          <Subjects />
        </Both>
      </Section>

      <Section title="TopicReview" note="Shown under the topic field at /series/new when the topic needs a second look.">
        <Both>
          {TOPIC_REVIEWS.map(({ name, typed, check }) => (
            <State key={name} name={name}>
              <TopicReview check={check} typed={typed} starting={null} onUse={() => {}} onEdit={() => {}} autoFocus={false} />
            </State>
          ))}
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
