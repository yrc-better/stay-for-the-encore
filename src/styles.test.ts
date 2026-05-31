import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("responsive CSS", () => {
  const styles = readFileSync("src/styles.css", "utf8");

  it("keeps personal and band actions side by side on tablet layouts", () => {
    expect(styles).toMatch(
      /@media \(max-width: 1099px\)[\s\S]*\.action-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
    );
  });

  it("keeps personal and band actions side by side on phone layouts", () => {
    expect(styles).toMatch(
      /@media \(max-width: 759px\)[\s\S]*\.action-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
    );
  });
});
