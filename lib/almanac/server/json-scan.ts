import "server-only";

/**
 * Watches JSON text as it streams in and hands back each element of the array
 * under `key` as soon as that element is complete. Strings and escapes are
 * tracked, so braces inside text never confuse it.
 */
export class ArrayScanner {
  private text = "";
  private start = -1; // index just after the array's "["
  private pos = 0;
  private depth = 0;
  private inString = false;
  private escaped = false;
  private elementStart = -1;
  private done = false;

  constructor(private key: string) {}

  /** Adds streamed text and returns the elements that closed in it, parsed. */
  push(chunk: string): unknown[] {
    this.text += chunk;
    const found: unknown[] = [];
    if (this.done) return found;

    if (this.start === -1) {
      const at = this.text.search(new RegExp(`"${this.key}"\\s*:\\s*\\[`));
      if (at === -1) return found;
      this.start = this.text.indexOf("[", at) + 1;
      this.pos = this.start;
    }

    for (; this.pos < this.text.length; this.pos += 1) {
      const c = this.text[this.pos];
      if (this.inString) {
        if (this.escaped) this.escaped = false;
        else if (c === "\\") this.escaped = true;
        else if (c === '"') this.inString = false;
        continue;
      }
      if (c === '"') {
        this.inString = true;
      } else if (c === "{" || c === "[") {
        if (this.depth === 0) this.elementStart = this.pos;
        this.depth += 1;
      } else if (c === "}" || c === "]") {
        if (this.depth === 0) {
          // The array itself closed.
          this.done = true;
          return found;
        }
        this.depth -= 1;
        if (this.depth === 0 && this.elementStart !== -1) {
          try {
            found.push(JSON.parse(this.text.slice(this.elementStart, this.pos + 1)));
          } catch {
            // Not valid on its own: the final, validated result still has it.
          }
          this.elementStart = -1;
        }
      }
    }
    return found;
  }
}
