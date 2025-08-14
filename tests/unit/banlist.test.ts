import { describe, it, expect } from "vitest"
import { checkBanned, BANNED_TITLE, BANNED_TAGS, BANNED_TEXT } from "@/lib/banlist"

describe("banlist", () => {
  it("detects banned title terms (case-insensitive)", () => {
    const r1 = checkBanned("This is NSFW content", BANNED_TITLE)
    expect(r1.ok).toBe(false)
    expect(r1.hits.length).toBeGreaterThan(0)

    const r2 = checkBanned("family friendly", BANNED_TITLE)
    expect(r2.ok).toBe(true)
  })

  it("detects banned tags", () => {
    const r1 = checkBanned("nsfw", BANNED_TAGS)
    expect(r1.ok).toBe(false)
    const r2 = checkBanned("puzzle", BANNED_TAGS)
    expect(r2.ok).toBe(true)
  })

  it("detects banned text patterns", () => {
    const r1 = checkBanned("do not doxx people", BANNED_TEXT)
    expect(r1.ok).toBe(false)
  })
})
