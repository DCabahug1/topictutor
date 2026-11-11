"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/almanac/Button";
import { LessonBody } from "@/components/almanac/LessonBody";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage, SessionPage } from "@/components/almanac/Page";
import { lessonDate } from "@/app/(almanac)/today/lesson/components/copy";
import { almanac, useAlmanac } from "@/lib/almanac";

/** A mistyped link can carry a broken escape, which should read as not found rather than crash. */
function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// A past daily lesson, to read again. Only the text: the check and the tutor belong to the day it ran.
export default function PastDailyLessonPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decode(rawId);
  const { data: lesson, error, reload } = useAlmanac(() => almanac.getPastDailyLesson(id), [id]);

  if (error?.kind === "notFound") {
    return (
      <PaperPage current="library">
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
          <Notice
            tone="info"
            headingLevel={1}
            kicker="Not found"
            title="This lesson isn’t here."
            body="The link may be mistyped, or the lesson belongs to another account."
            primary={{ label: "Go to Today", href: "/today" }}
            secondary={{ label: "Library", href: "/library" }}
          />
        </div>
      </PaperPage>
    );
  }

  // A lesson with no text counts as not loaded: there is nothing to read yet.
  if (error || (lesson && !lesson.paragraphs)) {
    return (
      <PaperPage current="library">
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="This lesson didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "Go to Library", href: "/library" }}
          />
        </div>
      </PaperPage>
    );
  }

  const leave = { leaveHref: "/library", leaveLabel: "Close lesson" };

  if (!lesson) {
    return (
      <SessionPage {...leave}>
        <div aria-busy="true" className="pt-7 md:pt-12">
          <p className="sr-only" role="status">
            Loading the lesson
          </p>
          <div aria-hidden="true" className="flex flex-col gap-3">
            <span className="h-3 w-40 bg-(--paper-sunk)" />
            <span className="mt-2 h-10 w-[70%] bg-(--paper-sunk)" />
          </div>
        </div>
      </SessionPage>
    );
  }

  return (
    <SessionPage
      {...leave}
      footer={
        <Button size="large" variant="secondary" href="/library">
          Back to Library
        </Button>
      }
    >
      <article>
        <header className="pt-7 md:pt-12">
          <div className="t-label flex flex-wrap justify-between gap-2 font-normal!">
            <span className="text-(--accent)">
              {lesson.subject} · <span className="md:hidden">{lessonDate(lesson.date, true)}</span>
              <span className="hidden md:inline">{lessonDate(lesson.date)}</span>
            </span>
            <span className="hidden text-(--ink-muted) md:inline">About {lesson.minutes} minutes</span>
          </div>
          <h1 className="m-0 mt-3 text-[42px] font-medium leading-[1.02] tracking-[-0.02em] md:mt-4 md:text-[clamp(42px,5vw,64px)] md:leading-none md:tracking-[-0.025em]">
            {lesson.title}
          </h1>
        </header>
        <LessonBody dropCap paragraphs={lesson.paragraphs ?? []} className="mt-[22px] md:mt-8" />
      </article>
    </SessionPage>
  );
}
