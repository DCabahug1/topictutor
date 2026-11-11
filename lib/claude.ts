import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const MODEL = "claude-sonnet-5-5";

const client = new Anthropic();

export const generateStructured = async <Schema extends z.ZodType>({
  system,
  user,
  schema,
}: {
  system: string;
  user: string;
  schema: Schema;
}): Promise<z.infer<Schema>> => {
  // Streamed so long course generations don't hit HTTP timeouts.
  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(schema),
      },
      system,
      messages: [{ role: "user", content: user }],
    })
    .finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("The model declined to generate this content");
  }

  if (message.parsed_output === null) {
    throw new Error(
      `The model returned no structured output (stop reason: ${message.stop_reason})`
    );
  }

  return message.parsed_output as z.infer<Schema>;
};
