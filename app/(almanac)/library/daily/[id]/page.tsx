"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/almanac/Button";
import { LessonBody } from "@/components/almanac/LessonBody";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage, SessionPage } from "@/components/almanac/Page";
import { almanac, lessonDate, useAlmanac } from "@/lib/almanac";

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
        <div className="mt-(--lead-top)">
          <Notice
            tone="info"
            headingLevel={1}
            kicker="Not found"
            title="This lesson isn’t here."
            body="The link may be mistyped, or the lesson belongs to another account."
            primary={{ label: "Go to Today", href: "/today" }}
            secondary={{ label: "or go to your Library", href: "/library" }}
          />
        </div>
      </PaperPage>
    );
  }

  // A lesson with no text counts as not loaded: there is nothing to read yet.
  if (error || (lesson && !lesson.paragraphs)) {
    return (
      <PaperPage current="library">
        <div className="mt-(--lead-top)">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="This lesson didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "or go to your Library", href: "/library" }}
          />
        </div>
      </PaperPage>
    );
  }

  const leave = { leaveHref: "/library", leaveLabel: "Close lesson" };

  if (!lesson) {
    return (
      <SessionPage {...leave}>
        <div aria-busy="true">
          <p className="sr-only" role="status">
            Loading the lesson
          </p>
          <div aria-hidden="true" className="flex flex-col gap-3">
            <span className="h-3 w-40 bg-(--paper-sunk)" />
            <span className="mt-4 h-12 w-[70%] bg-(--paper-sunk)" />
          </div>
        </div>
      </SessionPage>
    );
  }

  return (
    <SessionPage
      {...leave}
      footer={
        <Button icon href="/library">
          Back to your Library
        </Button>
      }
    >
      <article>
        <header>
          <p className="t-eyebrow m-0">
            {lesson.subject} · {lessonDate(lesson.date)}
          </p>
          <h1 className="t-lead-h1-sm after-eyebrow m-0 [overflow-wrap:anywhere]">{lesson.title}</h1>
        </header>
        <LessonBody dropCap paragraphs={lesson.paragraphs ?? []} className="mt-7 md:mt-9" />
      </article>
    </SessionPage>
  );
}
