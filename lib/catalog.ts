import { games as DEMO, type Game } from "@/lib/demo-data"

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
      local = (Array.isArray(arr) ? arr : []).map((g) => ({ ...g, origin: "local", slug: g.slug ?? slugify(g.title) }))
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

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
