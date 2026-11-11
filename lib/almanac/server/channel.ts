import "server-only";
import { splitSections } from "../rules";

/**
 * A queue between a writer running in the background and the response that
 * shows it. The writer keeps going if nobody is reading any more, so leaving
 * the page never cancels a lesson half way.
 */
export class Channel<T> {
  private items: T[] = [];
  private wake: (() => void) | null = null;
  private ended = false;
  private failure: unknown = null;

  push(item: T) {
    this.items.push(item);
    this.notify();
  }

  close() {
    this.ended = true;
    this.notify();
  }

  fail(error: unknown) {
    this.failure = error ?? new Error("failed");
    this.ended = true;
    this.notify();
  }

  private notify() {
    const wake = this.wake;
    this.wake = null;
    wake?.();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    while (true) {
      if (this.items.length) {
        yield this.items.shift()!;
        continue;
      }
      if (this.ended) {
        if (this.failure) throw this.failure;
        return;
      }
      await new Promise<void>((resolve) => {
        this.wake = resolve;
      });
    }
  }
}

/** Splits a finished lesson into its markdown sections, keeping each section's own line breaks. */
export function paragraphsOf(text: string): string[] {
  return splitSections(text);
}
