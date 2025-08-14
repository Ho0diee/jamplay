import { describe, it, expect } from "vitest"
import { CATEGORY_SUGGESTIONS, normalizeTag, dedupeTags } from "@/lib/tags"

describe("tags utils", () => {
  it("has 4 suggestions per known category", () => {
    for (const [cat, list] of Object.entries(CATEGORY_SUGGESTIONS)) {
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBe(4)
    }
  })

  it("normalizes and truncates tags", () => {
    expect(normalizeTag("Hello World")).toBe("hello-world")
    expect(normalizeTag("This is an extremely long tag value").length <= 20).toBe(true)
  })

  it("dedupes and caps at 10", () => {
    const input = ["A", "a", "B", "b", "C", "D", "E", "F", "G", "H", "I", "J", "K"]
    const out = dedupeTags(input)
    expect(out.length).toBe(10)
    expect(new Set(out).size).toBe(out.length)
  })
})
