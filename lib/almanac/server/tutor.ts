import "server-only";
import { streamText } from "@/lib/claude";
import type { TutorContext } from "../source";
import { AlmanacError, type TutorChunk } from "../types";
import { requireUser, type Learner } from "./context";
import { todaysLessonText } from "./daily";
import { tutorPrompt } from "./prompts";
import { seriesLessonText } from "./series";
import { CAPS, LIMITS, countUse } from "./usage";

const MARKER = /^\s*\[(\d)\]\s*/;

/**
 * Answers a question about the lesson on screen, from that lesson. The answer
 * opens with the paragraph it draws on, which is sent ahead of the text.
 * Nothing is stored.
 */
export async function* askTutor(learner: Learner, context: TutorContext, question: string | null): AsyncGenerator<TutorChunk> {
  const userId = requireUser(learner);
  const asked = question === null ? null : question.trim().slice(0, LIMITS.question);
  if (asked === "") throw new AlmanacError("writeFailed");

  const cap = learner.isGuest ? CAPS.guestQuestionsPerDay : CAPS.memberQuestionsPerDay;
  if (!(await countUse(`questions:${userId}`, cap))) throw new AlmanacError("writeFailed", "Daily question limit");

  const lesson =
    context.kind === "daily"
      ? await todaysLessonText(learner)
      : await seriesLessonText(learner, context.seriesId, context.number);

  let head = asked === null ? null : "";
  for await (const chunk of streamText({ ...tutorPrompt(lesson.title, lesson.paragraphs, asked), effort: "low", maxTokens: 800 })) {
    if (head === null) {
      yield { kind: "text", text: chunk };
      continue;
    }
    // Hold the first few characters until the paragraph marker is known.
    head += chunk;
    const match = head.match(MARKER);
    if (match) {
      const paragraph = Number(match[1]);
      if (paragraph >= 1 && paragraph <= lesson.paragraphs.length) yield { kind: "source", paragraph };
      const rest = head.slice(match[0].length);
      head = null;
      if (rest) yield { kind: "text", text: rest };
    } else if (head.length > 8 || !/^\s*\[?\d?\]?$/.test(head)) {
      // No marker after all: show what was held.
      const rest = head;
      head = null;
      yield { kind: "text", text: rest };
    }
  }
  if (head) yield { kind: "text", text: head };
}
