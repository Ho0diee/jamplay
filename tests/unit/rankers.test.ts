import { describe, it, expect } from "vitest"
import { timeDecayWeight, wilsonLowerBound, trendingScore, topRatedThisWeekScore, type RankableGame } from "@/lib/rankers"

describe("rankers", () => {
  it("timeDecayWeight halves every half-life", () => {
    const half = timeDecayWeight(6, 6)
    const quarter = timeDecayWeight(12, 6)
    expect(half).toBeCloseTo(0.5, 3)
    expect(quarter).toBeCloseTo(0.25, 3)
  })

  it("wilsonLowerBound reasonable ordering", () => {
    const a = wilsonLowerBound(80, 100)
    const b = wilsonLowerBound(40, 50)
    const c = wilsonLowerBound(8, 10)
    expect(a).toBeGreaterThan(b)
    expect(b).toBeGreaterThan(c)
  })

  it("trendingScore favors more recent plays and likes", () => {
    const now = new Date()
    const base: Omit<RankableGame, "id"|"title"|"description"|"tags"|"cover"> = {
      plays48h: 1000,
      likes7d: { up: 100, total: 150 },
      likesAll: { up: 500, total: 800 },
      publishedAt: new Date(now.getTime() - 24 * 36e5).toISOString(),
      updatedAt: now.toISOString(),
    }
    const older: RankableGame = { id: "1", title: "A", description: "", tags: [], cover: "", ...base, updatedAt: new Date(now.getTime() - 12 * 36e5).toISOString() }
    const recent: RankableGame = { id: "2", title: "B", description: "", tags: [], cover: "", ...base }
    expect(trendingScore(recent)).toBeGreaterThan(trendingScore(older))

    const moreLikes: RankableGame = { id: "3", title: "C", description: "", tags: [], cover: "", ...base, likes7d: { up: 120, total: 150 } }
    expect(trendingScore(moreLikes)).toBeGreaterThan(trendingScore(recent))
  })

  it("topRatedThisWeekScore downweights small samples", () => {
    const many: RankableGame = {
      id: "m", title: "Many", description: "", tags: [], cover: "",
      plays48h: 0, likes7d: { up: 40, total: 50 }, likesAll: { up: 0, total: 0 },
      publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    const few: RankableGame = {
      id: "f", title: "Few", description: "", tags: [], cover: "",
      plays48h: 0, likes7d: { up: 8, total: 10 }, likesAll: { up: 0, total: 0 },
      publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    expect(topRatedThisWeekScore(many)).toBeGreaterThan(topRatedThisWeekScore(few))
  })
})
