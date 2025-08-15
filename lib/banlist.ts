// Sitewide banned words list (seed baseline; expand later)
// Prefer word-boundaries where possible; keep case-insensitive
export const BANNED: (string | RegExp)[] = [
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

// Runtime-extendable entries (from attachments or ops input without committing words to repo)
const RUNTIME: RegExp[] = []

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

export function getBannedList(): (string | RegExp)[] {
  return [...BANNED, ...RUNTIME, ...loadExtraFromLocalStorage()]
}

export function checkBanned(s: string): { ok: boolean; hits: string[] } {
  const value = (s ?? "").toString()
  if (!value) return { ok: true, hits: [] }
  const hits: string[] = []
  for (const rule of getBannedList()) {
    if (typeof rule === "string") {
      if (value.toLowerCase().includes(rule.toLowerCase())) hits.push(rule)
    } else if (rule.test(value)) {
      hits.push(rule.source)
    }
  }
  return { ok: hits.length === 0, hits }
}
