import "server-only";
import { GenerationError, HAIKU, generateStructured } from "@/lib/claude";
import { CUSTOM_NAME_LIMIT, cleanCustomName } from "../other-subject";
import type { SeriesRequest, TopicCheck } from "../types";
import { requireUser, type Learner } from "./context";
import { topicCheckPrompt, topicCheckSchema, type TopicPurpose } from "./prompts";
import { CAPS, LIMITS, countUse } from "./usage";

/**
 * Reads a typed topic before a placement test is started. Nothing is charged
 * and nothing is stored. Whenever it can't decide (a cap, an outage) the topic
 * goes through as typed, and the placement writer still refuses harmful topics
 * on its own.
 */
export async function checkTopic(learner: Learner, request: SeriesRequest): Promise<TopicCheck> {
  const userId = requireUser(learner);
  return readTopic({
    topic: request.topic.trim().slice(0, LIMITS.topic),
    focus: (request.focus ?? "").trim().slice(0, LIMITS.focus),
    purpose: "series",
    scope: `topic-check:${userId}`,
    cap: CAPS.memberTopicChecksPerDay,
    limit: LIMITS.topic,
    empty: "Name a topic to start.",
  });
}

/**
 * The same reading for the name of a custom subject, before it is added.
 * Open to guests, since they pick subjects too. The daily writer still refuses
 * harmful subjects on its own if a name gets past this.
 */
export async function checkSubject(learner: Learner, name: string): Promise<TopicCheck> {
  const userId = requireUser(learner);
  return readTopic({
    topic: cleanCustomName(name),
    focus: "",
    purpose: "subject",
    scope: `subject-check:${userId}`,
    cap: CAPS.subjectChecksPerDay,
    limit: CUSTOM_NAME_LIMIT,
    empty: "Name your subject.",
  });
}

type Reading = {
  topic: string;
  focus: string;
  purpose: TopicPurpose;
  /** Usage counter for the daily cap. */
  scope: string;
  cap: number;
  /** Longest topic or suggestion handed back. */
  limit: number;
  /** The note when nothing was typed. */
  empty: string;
};

async function readTopic({ topic, focus, purpose, scope, cap, limit, empty }: Reading): Promise<TopicCheck> {
  const pass: TopicCheck = { verdict: "clear", topic, note: "", suggestions: [] };
  if (!topic) return { verdict: "unclear", topic: "", note: empty, suggestions: [] };

  try {
    if (!(await countUse(scope, cap))) return pass;
  } catch {
    return pass;
  }

  try {
    const raw = await generateStructured({
      ...topicCheckPrompt(topic, focus, purpose),
      schema: topicCheckSchema,
      route: purpose === "series" ? "topic-check" : "subject-check",
      model: HAIKU,
      effort: "low",
      maxTokens: 800,
    });
    // House style: curly apostrophes and quotes in anything shown to the learner.
    const curl = (s: string) => s.replace(/(\w)'(\w)/g, "$1’$2").replace(/'/g, "’").replace(/"([^"]*)"/g, "“$1”");
    const read = { ...raw, topic: curl(raw.topic), note: curl(raw.note), suggestions: raw.suggestions.map(curl) };
    const suggestions = [...new Set(read.suggestions.map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== read.topic.trim().toLowerCase()))]
      .map((s) => s.slice(0, limit))
      .slice(0, 3);
    const tidy = read.topic.trim().slice(0, limit);
    switch (read.verdict) {
      case "clear":
        return { ...pass, topic: tidy || topic };
      case "suggest":
        // A "suggestion" that only changes capitals is no reason to stop someone.
        if (!tidy || tidy.toLowerCase() === topic.toLowerCase()) {
          return suggestions.length ? { verdict: "suggest", topic, note: read.note.trim(), suggestions } : { ...pass, topic: tidy || topic };
        }
        return { verdict: "suggest", topic: tidy, note: read.note.trim(), suggestions };
      case "unclear":
        return { verdict: "unclear", topic: "", note: read.note.trim(), suggestions };
      case "refused":
        return { verdict: "refused", topic: "", note: read.note.trim(), suggestions: suggestions.slice(0, 2) };
    }
  } catch (cause) {
    // A model that won't even read the topic is a refusal. Anything else lets the topic through.
    if (cause instanceof GenerationError && /declined/.test(cause.message)) {
      return { verdict: "refused", topic: "", note: "", suggestions: [] };
    }
    console.error(`[almanac] ${purpose === "series" ? "topic" : "subject"} check:`, cause);
    return pass;
  }
}
