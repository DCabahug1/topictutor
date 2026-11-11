import type { Frame } from "@/lib/almanac/protocol";
import { after } from "next/server";
import { backgroundTasks, getLearner } from "@/lib/almanac/server/context";
import { stream } from "@/lib/almanac/server/dispatch";
import { AlmanacError } from "@/lib/almanac/types";

// A lesson's first open writes it while the reader watches. Needs Fluid Compute on Vercel past 60 seconds.
export const maxDuration = 300;

const encoder = new TextEncoder();
const line = (frame: Frame) => encoder.encode(`${JSON.stringify(frame)}\n`);

/** Streams one AlmanacSource call as newline-delimited JSON frames, ending in done or error. */
export async function POST(request: Request) {
  let body: { method?: unknown; args?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const call = typeof body.method === "string" ? stream(body.method, body.args ?? []) : null;
  if (!call) return new Response(null, { status: 400 });

  const background = backgroundTasks();
  after(background.drain);
  const learner = await getLearner(request, background.defer);
  const source = call(learner)[Symbol.asyncIterator]();

  const readable = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const step = await source.next();
        if (step.done) {
          controller.enqueue(line({ t: "done" }));
          controller.close();
          return;
        }
        const item = step.value;
        if ("row" in item) controller.enqueue(line({ t: "row", v: item.row }));
        else if ("kind" in item && item.kind === "source") controller.enqueue(line({ t: "source", v: item.paragraph }));
        else if ("kind" in item) controller.enqueue(line({ t: "text", v: item.text }));
        else controller.enqueue(line({ t: "text", v: item.text }));
      } catch (cause) {
        if (!(cause instanceof AlmanacError)) console.error(`[almanac] ${body.method}:`, cause);
        controller.enqueue(line({ t: "error", kind: cause instanceof AlmanacError ? cause.kind : "writeFailed" }));
        controller.close();
      }
    },
    // The reader left. Anything writing in the background keeps going.
    async cancel() {
      await source.return?.(undefined);
    },
  });

  return new Response(readable, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
