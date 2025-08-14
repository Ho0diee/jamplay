import { describe, it, expect } from "vitest"
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema } from "@/lib/create-schema"

describe("BasicsSchema", () => {
  it("accepts a valid title and slug", () => {
    const res = BasicsSchema.safeParse({
      title: "My Game",
      category: "RPG",
      tags: ["rpg"],
      slug: "my-game",
    })
    expect(res.success).toBe(true)
  })

  it("rejects empty title and bad slug", () => {
    const res = BasicsSchema.safeParse({
      title: "",
      category: "",
      slug: "Bad Slug!",
    })
    expect(res.success).toBe(false)
  })

  it("requires category", () => {
    const res = BasicsSchema.safeParse({
      title: "X",
      slug: "x",
    })
    expect(res.success).toBe(false)
  })
})

describe("MediaSchema", () => {
  it("requires cover on step 2", () => {
    const res = MediaSchema.safeParse({})
    expect(res.success).toBe(false)
  })

  it("accepts a valid cover + thumb", () => {
    const res = MediaSchema.safeParse({ cover: "data:image/jpeg;base64,abc", thumb: "data:image/jpeg;base64,xyz" })
    expect(res.success).toBe(true)
  })
})

describe("GameplaySchema", () => {
  it("requires description >= 30 and parses session length", () => {
    expect(GameplaySchema.safeParse({ description: "short", sessionLength: "10" }).success).toBe(false)
    const ok1 = GameplaySchema.safeParse({ description: "x".repeat(30), sessionLength: "10" })
    expect(ok1.success).toBe(true)
    const ok2 = GameplaySchema.safeParse({ description: "x".repeat(30), sessionLength: "5-20" })
    expect(ok2.success).toBe(true)
    const bad = GameplaySchema.safeParse({ description: "x".repeat(30), sessionLength: "400" })
    expect(bad.success).toBe(false)
  })
})

describe("BuildSchema", () => {
  it("requires play target appropriate to launch type", () => {
    expect(BuildSchema.safeParse({ launchType: "external", playUrlOrTemplateId: "https://x" }).success).toBe(true)
    expect(BuildSchema.safeParse({ launchType: "external", playUrlOrTemplateId: "notaurl" }).success).toBe(false)
    expect(BuildSchema.safeParse({ launchType: "embedded_template", playUrlOrTemplateId: "TMP-ABCDE" }).success).toBe(true)
  })
})
