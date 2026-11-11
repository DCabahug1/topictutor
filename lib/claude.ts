import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const MODEL = "claude-sonnet-5-5";

/** Every request gives up after two minutes, so a stuck call can't outlive its claim. */
const DEADLINE_MS = 120_000;

const client = new Anthropic({ timeout: DEADLINE_MS, maxRetries: 1 });

type Effort = "low" | "medium" | "high";

/** Thrown when the model declines or returns nothing usable. Callers turn it into "didn't finish writing". */
export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

export const generateStructured = async <Schema extends z.ZodType>({
  system,
  user,
  schema,
  effort = "medium",
  maxTokens = 16_000,
}: {
  system: string;
  user: string;
  schema: Schema;
  effort?: Effort;
  maxTokens?: number;
}): Promise<z.infer<Schema>> => {
  // Streamed so long generations don't hit HTTP timeouts.
  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort,
        format: betaZodOutputFormat(schema),
      },
      system,
      messages: [{ role: "user", content: user }],
    })
    .finalMessage();

  if (message.stop_reason === "refusal") {
    throw new GenerationError("The model declined to generate this content");
  }

  if (message.parsed_output === null) {
    throw new GenerationError(`The model returned no structured output (stop reason: ${message.stop_reason})`);
  }

  return message.parsed_output as z.infer<Schema>;
};

/**
 * Streams plain prose as it is written: lessons and tutor answers. Thinking is
 * off between tool calls, so the first words arrive without a silent pause.
 * Throws GenerationError if the model declines or stops early.
 */
export async function* streamText({
  system,
  user,
  effort = "low",
  maxTokens = 4_000,
  signal,
}: {
  system: string;
  user: string;
  effort?: Effort;
  maxTokens?: number;
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "between_tools" },
      output_config: { effort },
      system,
      messages: [{ role: "user", content: user }],
    },
    { signal }
  );

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
  }

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new GenerationError("The model declined to write this");
  if (message.stop_reason === "max_tokens") throw new GenerationError("The text ran past its length");
}
