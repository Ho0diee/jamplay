import { games as DEMO, type Game } from "@/lib/demo-data"
import { slugify } from "@/lib/slug"

export type CatalogGame = Game & { origin?: "demo" | "local"; slug?: string }

export function getCatalog(): CatalogGame[] {
  // Always start with demo data; mark as demo and derive slug
  const base: CatalogGame[] = DEMO.map((g) => ({ ...g, origin: "demo", slug: slugify(g.title) }))
  // Only read localStorage on client; otherwise return demo-only
  if (typeof window === "undefined") return base
  let local: CatalogGame[] = []
  try {
    const raw = localStorage.getItem("myGames")
    if (raw) {
      const arr = JSON.parse(raw) as CatalogGame[]
      local = (Array.isArray(arr) ? arr : []).map((g) => ({
        ...g,
        origin: "local",
        slug: g.slug ?? slugify(g.title),
        likes7d: (g as any).likes7d ?? { up: 0, total: 0 },
        likesAll: (g as any).likesAll ?? { up: 0, total: 0 },
      }))
    }
  } catch {}
  // Dedup by slug, prefer local over demo
  const bySlug = new Map<string, CatalogGame>()
  for (const g of [...base, ...local]) {
    const s = (g.slug ?? slugify(g.title)).toLowerCase()
    bySlug.set(s, { ...g, slug: s })
  }
  return Array.from(bySlug.values())
}

// slugify is re-exported from lib/slug

export function visibleTags(g: any): string[] {
  const tags = Array.isArray(g?.tags) ? (g.tags as string[]).filter((s) => typeof s === "string" && s.trim().length > 0) : []
  if (tags.length > 0) return tags
  const cat = (g?.category ?? "").toString().trim()
  return cat ? [cat] : []
}
