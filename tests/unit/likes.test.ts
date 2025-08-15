import { describe, it, expect, beforeEach } from "vitest"
import { addLike, getLocalLikes, getDisplayLikes } from "@/lib/likes"

class MemoryStorage {
  private store: Record<string, string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, value: string) { this.store[key] = String(value) }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
}

describe("likes local store", () => {
  const mem = new MemoryStorage() as any
  beforeEach(() => {
    ;(global as any).window = { localStorage: mem, dispatchEvent: () => {} }
    mem.clear()
  })

  it("defaults to 0 when absent", () => {
    expect(getLocalLikes("abc")).toBe(0)
  })

  it("increments and persists", () => {
    expect(addLike("abc")).toBe(1)
    expect(getLocalLikes("abc")).toBe(1)
    expect(addLike("abc", 2)).toBe(3)
    expect(getLocalLikes("abc")).toBe(3)
  })

  it("getDisplayLikes adds base + local", () => {
    addLike("g1", 5)
    expect(getDisplayLikes(10, "g1")).toBe(15)
  })
})
