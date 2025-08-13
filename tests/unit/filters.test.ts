import { describe, it, expect } from "vitest"
import { filterByCategory, normalizeTagSlug } from "@/lib/filters"

describe("filters", () => {
  const items = [
    { id: 1, tags: ["Puzzle", "Story Telling"] },
    { id: 2, tags: ["strategy", "logic"] },
    { id: 3, tags: ["music"] },
  ]

  it("returns originals when category is null/undefined", () => {
    expect(filterByCategory(items, null)).toEqual(items)
    expect(filterByCategory(items, undefined)).toEqual(items)
  })

  it("filters correctly for exact tag slug", () => {
    const out = filterByCategory(items, "strategy")
    expect(out.map(i=>i.id)).toEqual([2])
  })

  it("case/whitespace normalization", () => {
    const out = filterByCategory(items, "  story-telling  ")
    expect(out.map(i=>i.id)).toEqual([1])
    expect(normalizeTagSlug("Story Telling")).toBe("story-telling")
  })
})
