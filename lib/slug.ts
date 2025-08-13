export function slugify(input: string, opts?: { max?: number }) {
  const max = opts?.max ?? 60
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, Math.max(0, max))
}

export function validateSlugFormat(slug: string): { ok: true } | { ok: false; error: string } {
  const s = slug.trim()
  if (s.length < 3 || s.length > 60) return { ok: false, error: "3–60 characters" }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return { ok: false, error: "Use lowercase letters, numbers, and hyphens" }
  return { ok: true }
}

export function isUnique(value: string, existing: Set<string>): boolean {
  return !existing.has(value.toLowerCase())
}

export function normalizeTags(tags: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const t of tags) {
    const n = slugify(t)
    if (n && !seen.has(n)) { seen.add(n); out.push(n) }
  }
  return out
}
