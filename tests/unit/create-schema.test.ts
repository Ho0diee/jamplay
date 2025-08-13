import { describe, it, expect } from "vitest"
import { BasicsSchema, MediaSchema } from "@/lib/create-schema"

describe("BasicsSchema", () => {
  it("accepts a valid title and slug", () => {
    const res = BasicsSchema.safeParse({
      title: "My Game",
      tagline: "Fun game",
      category: "RPG",
      tags: ["rpg"],
      slug: "my-game",
      visibility: "draft",
    })
    expect(res.success).toBe(true)
  })

  it("rejects empty title and bad slug", () => {
    const res = BasicsSchema.safeParse({
      title: "",
      category: "",
      slug: "Bad Slug!",
      visibility: "draft",
    })
    expect(res.success).toBe(false)
  })

  it("requires category", () => {
    const res = BasicsSchema.safeParse({
      title: "X",
      slug: "x",
      visibility: "draft",
    })
    expect(res.success).toBe(false)
  })
})

describe("MediaSchema", () => {
  it("requires cover on step 2", () => {
    const res = MediaSchema.safeParse({})
    expect(res.success).toBe(false)
  })

  it("accepts a valid cover", () => {
    const res = MediaSchema.safeParse({ cover: "https://example.com/x.jpg" })
    expect(res.success).toBe(true)
  })
})
