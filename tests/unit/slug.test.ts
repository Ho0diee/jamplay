import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("normalizes and collapses spaces/punct", () => {
    expect(slugify("My  Game!!")).toBe("my-game");
  });
  it("respects max length", () => {
    const s = "x".repeat(100);
    expect(slugify(s, 10)).toBe("x".repeat(10));
  });
});
