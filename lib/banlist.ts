export const BANNED_TITLE: (string | RegExp)[] = [
  /nsfw/i,
  /cheat(er|ing)?/i,
  /hack(ing|er)?/i,
]

export const BANNED_TAGS: (string | RegExp)[] = [
  /nsfw/i,
  /hate/i,
  /slur/i,
]

export const BANNED_TEXT: (string | RegExp)[] = [
  /doxx/i,
  /harass/i,
]

export function checkBanned(value: string, rules: (string | RegExp)[]): { ok: boolean; hits: string[] } {
  if (!value) return { ok: true, hits: [] }
  const hits: string[] = []
  for (const rule of rules) {
    if (typeof rule === "string") {
      if (value.toLowerCase().includes(rule.toLowerCase())) hits.push(rule)
    } else {
      if (rule.test(value)) hits.push(rule.source)
    }
  }
  return { ok: hits.length === 0, hits }
}
