import "server-only";
import Anthropic, { AnthropicError } from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

/** The default: the question writers, where quality matters most. */
export const SONNET = "claude-sonnet-5-5";
/** About 20x cheaper. For short, well-specified work: prose from set key points, tutor answers, checks. */
export const HAIKU = "claude-haiku-5-5";

type Model = typeof SONNET | typeof HAIKU;

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

/**
 * Haiku has no server-side fallback (a fallback list is a 400), so only Sonnet
 * asks for one. A refusal on Haiku still ends with stop_reason "refusal".
 */
const fallbackFor = (model: Model) =>
  model === SONNET ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {};

/** One line per call, so cost per route can be read from the server log. */
function logUsage(route: string, message: Anthropic.Beta.BetaMessage) {
  const { input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens } = message.usage;
  console.info(
    `[claude] ${JSON.stringify({
      route,
      model: message.model,
      input: input_tokens,
      output: output_tokens,
      cacheRead: cache_read_input_tokens ?? 0,
      cacheWrite: cache_creation_input_tokens ?? 0,
      stop: message.stop_reason,
    })}`
  );
}

/**
 * The model's JSON can break a limit the schema sets (four key points where
 * three is the most), and the SDK then throws a plain AnthropicError from
 * finalMessage. API errors subclass AnthropicError, so they don't match here.
 */
function isParseFailure(error: unknown): error is AnthropicError {
  return (
    error instanceof AnthropicError &&
    !(error instanceof Anthropic.APIError) &&
    error.message.startsWith("Failed to parse structured output")
  );
}

function parseFailed(route: string, error: AnthropicError): GenerationError {
  console.warn(`[claude] ${JSON.stringify({ route, failure: "parse", detail: error.message.slice(0, 300) })}`);
  return new GenerationError("The model's output didn't match the expected shape");
}

/** Writes structured output, asking once more if the first answer doesn't fit the schema. */
export const generateStructured = async <Schema extends z.ZodType>(
  params: Parameters<typeof generateOnce<Schema>>[0]
): Promise<z.infer<Schema>> => {
  try {
    return await generateOnce(params);
  } catch (error) {
    if (!isParseFailure(error)) throw error;
    parseFailed(params.route, error);
  }
  try {
    return await generateOnce({ ...params, route: `${params.route}-retry` });
  } catch (error) {
    throw isParseFailure(error) ? parseFailed(`${params.route}-retry`, error) : error;
  }
};

const generateOnce = async <Schema extends z.ZodType>({
  route,
  system,
  user,
  schema,
  model = SONNET,
  effort = "medium",
  maxTokens = 16_000,
}: {
  route: string;
  system: string;
  user: string;
  schema: Schema;
  model?: Model;
  effort?: Effort;
  maxTokens?: number;
}): Promise<z.infer<Schema>> => {
  // Streamed so long generations don't hit HTTP timeouts.
  const message = await client.beta.messages
    .stream({
      model,
      max_tokens: maxTokens,
      ...fallbackFor(model),
      output_config: {
        effort,
        format: betaZodOutputFormat(schema),
      },
      system,
      messages: [{ role: "user", content: user }],
    })
    .finalMessage();
  logUsage(route, message);

  if (message.stop_reason === "refusal") {
    throw new GenerationError("The model declined to generate this content");
  }

  if (message.parsed_output === null) {
    throw new GenerationError(`The model returned no structured output (stop reason: ${message.stop_reason})`);
  }

  return message.parsed_output as z.infer<Schema>;
};

/**
 * Streams structured output as raw JSON text while it is written, then returns
 * the parsed, schema-checked result. Lets a caller show each finished piece of
 * a list as soon as it closes.
 */
export async function* streamStructured<Schema extends z.ZodType>({
  route,
  system,
  user,
  schema,
  model = SONNET,
  effort = "medium",
  maxTokens = 16_000,
}: {
  route: string;
  system: string;
  user: string;
  schema: Schema;
  model?: Model;
  effort?: Effort;
  maxTokens?: number;
}): AsyncGenerator<string, z.infer<Schema>> {
  const stream = client.beta.messages.stream({
    model,
    max_tokens: maxTokens,
    ...fallbackFor(model),
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: user }],
  });

  // The SDK parses when the last event arrives, so a bad shape can throw from
  // the loop as well as from finalMessage. The text has already gone to the
  // caller, so there's no retry here: a clear error is enough.
  let message;
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    message = await stream.finalMessage();
  } catch (error) {
    throw isParseFailure(error) ? parseFailed(route, error) : error;
  }
  logUsage(route, message);
  if (message.stop_reason === "refusal") throw new GenerationError("The model declined to generate this content");
  if (message.parsed_output === null) {
    throw new GenerationError(`The model returned no structured output (stop reason: ${message.stop_reason})`);
  }
  return message.parsed_output as z.infer<Schema>;
}

/**
 * Streams plain prose as it is written: lessons and tutor answers. Thinking is
 * off, so the first words arrive without a silent pause. Sonnet turns it off
 * with "between_tools"; Haiku with "disabled" (allowed at effort high or below).
 * Throws GenerationError if the model declines or stops early.
 */
export async function* streamText({
  route,
  system,
  user,
  model = SONNET,
  effort = "low",
  maxTokens = 4_000,
  signal,
}: {
  route: string;
  system: string;
  user: string;
  model?: Model;
  effort?: Effort;
  maxTokens?: number;
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const stream = client.beta.messages.stream(
    {
      model,
      max_tokens: maxTokens,
      ...fallbackFor(model),
      thinking: model === SONNET ? { type: "between_tools" } : { type: "disabled" },
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
  logUsage(route, message);
  if (message.stop_reason === "refusal") throw new GenerationError("The model declined to write this");
  if (message.stop_reason === "max_tokens") throw new GenerationError("The text ran past its length");
}
