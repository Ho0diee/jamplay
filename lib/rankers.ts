export function timeDecayWeight(ageHours: number, halfLifeHours = 6): number {
  if (!isFinite(ageHours) || ageHours < 0) return 1
  if (halfLifeHours <= 0) return 1
  // exponential half-life decay: w = 0.5^(age / halfLife)
  return Math.pow(0.5, ageHours / halfLifeHours)
}

export function wilsonLowerBound(positive: number, total: number, z = 1.96): number {
  if (total <= 0 || positive <= 0) return 0
  if (positive > total) positive = total
  const phat = positive / total
  const z2 = z * z
  const denom = 1 + z2 / total
  const centre = phat + z2 / (2 * total)
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * total)) / total)
  return (centre - margin) / denom
}

export type RankableGame = {
  id: string
  title: string
  description: string
  tags: string[]
  cover: string
  plays48h: number
  likes7d: { up: number; total: number }
  likesAll: { up: number; total: number }
  publishedAt: string // ISO
  updatedAt: string // ISO
}

export function trendingScore(game: RankableGame): number {
  const now = Date.now()
  // Treat plays48h as velocity, decay by age of update
  const ageH = Math.max(0, (now - Date.parse(game.updatedAt)) / 36e5)
  const decayedVelocity = (game.plays48h || 0) * timeDecayWeight(ageH, 6)

  const weekWL = wilsonLowerBound(game.likes7d.up || 0, game.likes7d.total || 0)

  const publishedAgeH = Math.max(0, (now - Date.parse(game.publishedAt)) / 36e5)
  const noveltyBoost = publishedAgeH < 24 * 7 ? 1 : 0 // boost if younger than 7d

  return 0.6 * decayedVelocity + 0.3 * weekWL * 100 + 0.1 * noveltyBoost * 100
}

export function topRatedThisWeekScore(game: RankableGame): number {
  const total = game.likes7d.total || 0
  const up = game.likes7d.up || 0
  if (total <= 0) return 0
  let score = wilsonLowerBound(up, total)
  // downweight if too few samples (< 20)
  if (total < 20) score *= total / 20
  return score * 100
}
