// Canonical sitewide banned words list (seed baseline; expand later)
// Prefer word-boundaries where possible; keep case-insensitive
export const BANNED: (string | RegExp)[] = [
  /\b(fuck|shit|bitch)\b/i, // baseline profanities
  // existing safety terms
  /\bnsfw\b/i,
  /\bhate\b/i,
  /\bracist\b/i,
  /\bsexist\b/i,
  /\bslur(s)?\b/i,
  /\bcheat(er|ing)?\b/i,
  /\bhack(er|ing)?\b/i,
  /\bdoxx(ing)?\b/i,
  /\bharass(ment|ing)?\b/i,
]

// Targeted subsets used by unit tests and specific UI contexts
export const BANNED_TITLE: (string | RegExp)[] = [
  /\bnsfw\b/i,
]

export const BANNED_TAGS: (string | RegExp)[] = [
  /\bnsfw\b/i,
]

export const BANNED_TEXT: (string | RegExp)[] = [
  /\bdoxx(ing)?\b/i,
  /\bharass(ment|ing)?\b/i,
]

// Runtime-extendable entries (from attachments or ops input without committing words to repo)
const RUNTIME: RegExp[] = []
// Cache for remotely loaded text list (public/banned_words_list.txt)
let REMOTE_CACHE: RegExp[] | null = null

function toWordRegex(w: string): RegExp {
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\b${escaped}\\b`, "i")
}

function uniqRegex(list: RegExp[]): RegExp[] {
  const seen = new Set<string>()
  const out: RegExp[] = []
  for (const r of list) {
    const key = r.toString()
    if (!seen.has(key)) { seen.add(key); out.push(r) }
  }
  return out
}

function loadExtraFromLocalStorage(): RegExp[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("extraBanned")
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    const regexes: RegExp[] = []
    for (const item of arr) {
      if (typeof item === "string" && item.trim()) regexes.push(toWordRegex(item.trim()))
    }
    return uniqRegex(regexes)
  } catch {
    return []
  }
}

export function addBanned(entries: Array<string | RegExp>): void {
  const add: RegExp[] = []
  for (const e of entries) {
    if (!e) continue
    if (e instanceof RegExp) add.push(e)
    else if (typeof e === "string" && e.trim()) add.push(toWordRegex(e.trim()))
  }
  const deduped = uniqRegex([...RUNTIME, ...add])
  RUNTIME.length = 0
  RUNTIME.push(...deduped)
}

async function loadRemoteList(): Promise<RegExp[]> {
  if (typeof window === "undefined") return []
  if (REMOTE_CACHE) return REMOTE_CACHE
  try {
    const res = await fetch("/banned_words_list.txt", { cache: "force-cache" })
    if (!res.ok) return []
    const text = await res.text()
    const terms = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    REMOTE_CACHE = uniqRegex(terms.map(toWordRegex))
    return REMOTE_CACHE
  } catch {
    return []
  }
}

export function getBannedList(): (string | RegExp)[] {
  // Note: synchronous callers won't have remote terms on first run;
  // UI should call initBanlist() once to warm the cache.
  return [...BANNED, ...RUNTIME, ...(REMOTE_CACHE ?? []), ...loadExtraFromLocalStorage()]
}

export function checkBanned(s: string, list?: (string | RegExp)[]): { ok: boolean; hits: string[] } {
  const value = (s ?? "").toString()
  if (!value) return { ok: true, hits: [] }
  const hits: string[] = []
  const rules = Array.isArray(list) ? list : getBannedList()
  for (const rule of rules) {
    if (typeof rule === "string") {
      if (value.toLowerCase().includes(rule.toLowerCase())) hits.push(rule)
    } else if (rule.test(value)) {
      hits.push(rule.source)
    }
  }
  return { ok: hits.length === 0, hits }
}

// New canonical helpers used by Create UI for field-level feedback
export type BannedHit = { term: string; index: number }

export function findBanned(value: string): BannedHit[] {
  const input = (value ?? "").toString()
  if (!input) return []
  const hits: BannedHit[] = []
  for (const rule of getBannedList()) {
    if (typeof rule === "string") {
      const idx = input.toLowerCase().indexOf(rule.toLowerCase())
      if (idx !== -1) hits.push({ term: rule, index: idx })
    } else {
      const m = input.match(rule)
      if (m) hits.push({ term: m[0], index: m.index ?? 0 })
    }
  }
  return hits
}

export function hasBanned(value: string): boolean {
  return findBanned(value).length > 0
}

// Allow UI to warm-fetch the remote list on app load
export async function initBanlist(): Promise<void> {
  try {
    await loadRemoteList()
  } catch {}
}
