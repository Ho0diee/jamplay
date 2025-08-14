import { slugify } from "@/lib/slug"

export const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  Adventure: ["exploration", "story", "quest", "puzzle"],
  RPG: ["turn-based", "character", "skills", "loot"],
  Puzzle: ["logic", "brain-teaser", "match", "timing"],
  Horror: ["survival", "atmospheric", "ghost", "jump-scare"],
  "Sci-Fi": ["space", "future", "robot", "alien"],
  Romance: ["dating", "vn", "choices", "slice-of-life"],
}

export function normalizeTag(t: string): string {
  return slugify(t).slice(0, 20)
}

export function dedupeTags(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of list) {
    const s = normalizeTag(t)
    if (s && !seen.has(s)) { seen.add(s); out.push(s) }
  }
  return out.slice(0, 10)
}
