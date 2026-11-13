import { describe, expect, it } from "vitest";
import { drawnWidth, holdBackOpenMath, normalizeMath, plainText, sectionSlots } from "./rules";

describe("sectionSlots", () => {
  it("holds the reserved places while the lesson is being written", () => {
    expect(sectionSlots(1, 3, true)).toBe(3);
    expect(sectionSlots(2, 3, true)).toBe(3);
  });

  it("drops leftover places once a two-section lesson is written", () => {
    expect(sectionSlots(2, 3, false)).toBe(2);
  });

  it("never cuts sections a lesson has", () => {
    expect(sectionSlots(4, 3, true)).toBe(4);
    expect(sectionSlots(4, 3, false)).toBe(4);
  });

  it("holds the places when nothing has arrived yet", () => {
    expect(sectionSlots(0, 3, false)).toBe(3);
  });
});

describe("normalizeMath", () => {
  it("leaves money alone, since single dollars are never maths", () => {
    expect(normalizeMath("Costs $5 and $10 today.")).toBe("Costs $5 and $10 today.");
  });

  it("leaves maths where the writer put it", () => {
    const inline = String.raw`The series $$\sum_{n=1}^\infty \frac{1}{2^n} = 1$$ adds up to one.`;
    expect(normalizeMath(inline)).toBe(inline);
    const block = "Intro.\n\n$$\n" + String.raw`\int_0^1 x^2\,dx` + "\n$$\n\nAfter.";
    expect(normalizeMath(block)).toBe(block);
  });

  it("reads \\( \\) as inline maths and \\[ \\] as an equation on its own lines", () => {
    expect(normalizeMath(String.raw`Take \(x\) and \[y = 2x\] here.`)).toBe("Take $$x$$ and\n\n$$\ny = 2x\n$$\n\nhere.");
  });

  it("takes punctuation after a \\[ \\] equation into it", () => {
    expect(normalizeMath(String.raw`Euler wrote \[e^{i\pi} + 1 = 0\], the famous one.`)).toBe(
      "Euler wrote\n\n$$\n" + String.raw`e^{i\pi} + 1 = 0,` + "\n$$\n\nthe famous one."
    );
  });

  it("keeps a \\[ \\] equation inside its list item", () => {
    expect(normalizeMath(String.raw`- With \[a^2 + b^2 = c^2\] in it` + "\n- Second")).toBe(
      "- With\n\n  $$\n  a^2 + b^2 = c^2\n  $$\n\n  in it\n- Second"
    );
  });

  it("moves a formula too wide for a phone line onto its own line, and leaves ones that fit", () => {
    const wide = String.raw`(x_1 + x_2 + x_3 + x_4 + x_5)^2 = x_1^2 + x_2^2 + x_3^2 + x_4^2 + x_5^2 + 2\sum_{i<j} x_i x_j`;
    expect(normalizeMath(`Expanding gives $$${wide}$$ in full.`)).toBe(`Expanding gives\n\n$$\n${wide}\n$$\n\nin full.`);
    const fits = String.raw`Squaring gives $$(a + b)^2 = a^2 + 2ab + b^2$$ in short.`;
    expect(normalizeMath(fits)).toBe(fits);
  });

  it("keeps even a wide formula inline in questions and options", () => {
    const wide = String.raw`$$(x_1 + x_2 + x_3 + x_4 + x_5)^2 = x_1^2 + x_2^2 + x_3^2 + x_4^2 + x_5^2$$`;
    expect(normalizeMath(`Is ${wide} true?`, { inline: true })).toBe(`Is ${wide} true?`);
  });

  it("folds a set-apart equation back into the sentence in questions and options", () => {
    expect(normalizeMath("What is\n\n$$\n" + String.raw`\int_0^1 x^2\,dx` + "\n$$\n\n?", { inline: true })).toBe(
      String.raw`What is $$\int_0^1 x^2\,dx$$?`
    );
    expect(normalizeMath(String.raw`So \[x = 2\] works.`, { inline: true })).toBe("So $$x = 2$$ works.");
  });

  it("never touches code or table rows", () => {
    expect(normalizeMath(String.raw`Code ` + "`$$x = 1$$`" + ` stays.`)).toBe("Code `$$x = 1$$` stays.");
    expect(normalizeMath(String.raw`| \[x = 1\] | y |`)).toBe("| $$x = 1$$ | y |");
  });
});

describe("drawnWidth", () => {
  // Widths measured in the browser, in em. The estimate only has to tell what fits a phone line.
  it("lands within about an em of what KaTeX draws", () => {
    expect(Math.abs(drawnWidth(String.raw`(a + b)^2 = a^2 + 2ab + b^2`) - 10.3)).toBeLessThan(1.5);
    expect(Math.abs(drawnWidth(String.raw`\frac{1}{2} + \frac{1}{4} + \frac{1}{8} + \dots`) - 6.6)).toBeLessThan(1.5);
    expect(Math.abs(drawnWidth(String.raw`-1 < r < 1`) - 4.9)).toBeLessThan(1.5);
  });
});

describe("holdBackOpenMath", () => {
  it("holds back maths that is still being written", () => {
    expect(holdBackOpenMath(String.raw`The sum $$\frac{1}{`)).toBe("The sum");
    expect(holdBackOpenMath(String.raw`Done $$x$$ and \[ a`)).toBe("Done $$x$$ and");
  });

  it("leaves finished maths and money alone", () => {
    expect(holdBackOpenMath("Done $$x$$ for $5.")).toBe("Done $$x$$ for $5.");
  });
});

describe("plainText with maths", () => {
  it("reads LaTeX as symbols", () => {
    expect(plainText(String.raw`The series $$\sum_{n=1}^\infty \frac{1}{2^n} = 1$$.`)).toBe("The series Σ_(n=1)^∞ 1/(2ⁿ) = 1.");
    expect(plainText(String.raw`Area is $$\pi r^2$$ and $$\int_0^1 x\,dx = \tfrac12$$`)).toBe("Area is π r² and ∫₀¹ x dx = 1/2");
  });
});
