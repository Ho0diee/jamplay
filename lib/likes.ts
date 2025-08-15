export type LikesMap = Record<string, number>

const KEY = "likesBySlug"

export function getLocalLikes(slug: string): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = window.localStorage.getItem(KEY)
    const map: LikesMap = raw ? JSON.parse(raw) : {}
    const v = map[slug] ?? 0
    return Number.isFinite(v) && v > 0 ? v : 0
  } catch {
    return 0
  }
}

export function addLike(slug: string, delta = 1): number {
  if (typeof window === "undefined") return 0
  const raw = window.localStorage.getItem(KEY)
  const map: LikesMap = raw ? JSON.parse(raw) : {}
  const next = Math.max(0, (map[slug] ?? 0) + delta)
  map[slug] = next
  window.localStorage.setItem(KEY, JSON.stringify(map))
  try {
    window.dispatchEvent(new CustomEvent("likes:changed", { detail: { slug } }))
  } catch {}
  return next
}

export function getDisplayLikes(baseLikes: number | undefined, slug: string): number {
  return (baseLikes ?? 0) + getLocalLikes(slug)
}
