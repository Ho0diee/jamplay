import { getBannedList } from "@/lib/banlist"

export function sanitizeForDisplay(s: string, banned?: (string|RegExp)[]): string {
  const input = (s ?? "").toString()
  if (!input) return ""
  let out = input
  const list = banned ?? getBannedList()
  for (const rule of list) {
    if (typeof rule === "string") {
      const re = new RegExp(rule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      out = out.replace(re, mask)
    } else {
  const flags = rule.flags.includes("g") ? rule.flags : rule.flags + "g"
  const re = new RegExp(rule.source, flags)
  out = out.replace(re, mask)
    }
  }
  return out
}

function mask(match: string): string {
  if (match.length <= 3) return "***"
  const head = match.slice(0, 3)
  const tail = match.length - 3
  return head + "*".repeat(tail)
}

// No local default; relies on BANNED from lib/banlist
