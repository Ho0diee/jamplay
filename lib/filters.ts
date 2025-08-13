export function normalizeTagSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function filterByCategory<T extends { tags?: string[] }>(items: T[], category?: string | null): T[] {
  if (!category) return items
  const cat = normalizeTagSlug(category)
  return items.filter((i) => (i.tags ?? []).some((t) => normalizeTagSlug(t) === cat))
}

export function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) {
    const s = item.slug.toLowerCase()
    if (!map.has(s)) map.set(s, item)
  }
  return Array.from(map.values())
}
