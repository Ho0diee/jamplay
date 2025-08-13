import { z, type RefinementCtx } from "zod"
import { slugify, validateSlugFormat, normalizeTags } from "@/lib/slug"
import { games as DEMO } from "@/lib/demo-data"

export const visibilityEnum = z.enum(["draft", "unlisted", "public"]) 

const BasicsCore = z.object({
  title: z.string().trim().min(4, "Min 4 characters").max(80, "Max 80 characters"),
  tagline: z
    .union([z.string().max(120, "Max 120 characters"), z.literal("")])
    .optional()
    .transform((v: string | undefined): string | undefined => (v === "" ? undefined : v)),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(10).optional().transform((arr: string[] | undefined) => normalizeTags(arr ?? [])),
  slug: z.string().transform((s: string) => slugify(s)).superRefine((val: string, ctx: RefinementCtx) => {
    const fmt = validateSlugFormat(val)
    if (!fmt.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: fmt.error, path: ["slug"] })
    if (val.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Min 3 characters", path: ["slug"] })
  }),
  // moved visibility to Review step
})

export type BasicsCoreType = z.infer<typeof BasicsCore>
export const BasicsSchema = BasicsCore.superRefine((val: BasicsCoreType, ctx: RefinementCtx) => {
  // Uniqueness checks
  const titleSet = buildExistingTitleSet()
  const slugSet = buildExistingSlugSet()
  if (titleSet.has(val.title.trim().toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Title already exists", path: ["title"] })
  }
  if (slugSet.has(val.slug.trim().toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Slug already exists", path: ["slug"] })
  }
})

export function makeBasicsSchema(existingTitles: Set<string>, existingSlugs: Set<string>) {
  return BasicsCore.superRefine((val: BasicsCoreType, ctx: RefinementCtx) => {
    if (existingTitles.has(val.title.trim().toLowerCase())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Title already exists", path: ["title"] })
    }
    if (existingSlugs.has(val.slug.trim().toLowerCase())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Slug already exists", path: ["slug"] })
    }
  })
}

export function isYouTubeUrl(u: string): boolean {
  try {
    const url = new URL(u)
    if (url.hostname.includes("youtube.com")) return url.searchParams.has("v")
    if (url.hostname === "youtu.be") return !!url.pathname.slice(1)
    return false
  } catch { return false }
}

export const MediaSchema = z.object({
  cover: z.string().min(1, { message: "Cover is required" }),
  thumb: z.string().min(1, { message: "Square thumbnail is required" }).optional(),
  gallery: z.array(z.string()).max(5).optional(),
  trailerUrl: z
    .union([z.string(), z.literal("")])
    .optional()
    .transform((v: string | undefined): string | undefined => (v === "" ? undefined : v))
  .refine((v: string | undefined) => v === undefined || isYouTubeUrl(v), { message: "Enter a valid YouTube URL" }),
})

export const CreateDraftSchema = BasicsSchema.merge(MediaSchema.partial())
export type CreateDraft = z.infer<typeof CreateDraftSchema>

// Step 3: Gameplay
export const GameplaySchema = z.object({
  description: z.string().min(80, "Min 80 characters").max(2000, "Max ~2000 characters"),
  howToPlay: z.string().optional(),
  controls: z.string().optional(),
  sessionLength: z.string().min(1, "Session length is required").transform((v: string, ctx: RefinementCtx) => {
    const s = v.trim()
    if (/^\d+$/.test(s)) {
      const m = parseInt(s, 10)
      if (m >= 1 && m <= 300) return { type: "single" as const, minutes: m }
    } else if (/^(\d+)-(\d+)$/.test(s)) {
      const [, a, b] = s.match(/^(\d+)-(\d+)$/) as RegExpMatchArray
      const min = parseInt(a, 10)
      const max = parseInt(b, 10)
      if (min >= 1 && max <= 300 && min < max) return { type: "range" as const, min, max }
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use minutes (1–300) or m-n range", path: ["sessionLength"] })
    return z.NEVER
  }),
  players: z.enum(["solo", "co-op", "multiplayer"]),
  contentWarnings: z.array(z.string()).max(20).optional(),
})

// Step 4: Build & Access
export const BuildSchema = z.object({
  launchType: z.enum(["external", "embedded_template", "api_endpoint"]),
  playUrlOrTemplateId: z.string().min(1, "Required").optional(),
  version: z.string().regex(/^\d+$/, "Version must be an integer").transform((s: string) => s || "1"),
  changelog: z.string().max(200).optional(),
}).refine((v: { launchType?: string; playUrlOrTemplateId?: string }) => {
  // Require playUrlOrTemplateId when launchType is any of the allowed options
  if (!v.launchType) return false
  if (v.launchType === "external") return /^https?:\/\//i.test(v.playUrlOrTemplateId ?? "")
  if (v.launchType === "embedded_template") return /^TMP-[A-Z0-9]{5,10}$/.test(v.playUrlOrTemplateId ?? "")
  return !!v.playUrlOrTemplateId && v.playUrlOrTemplateId.trim().length > 0
}, { path: ["playUrlOrTemplateId"], message: "Required" })

// Step 5: Community
export const CommunitySchema = z.object({
  creatorName: z.string().optional(),
  links: z.object({
    site: z.string().url().optional(),
    discord: z.string().url().optional(),
    x: z.string().url().optional(),
  }).optional(),
  supportUrl: z.string().url().optional(),
})

// Step 6: Safety & Rights
export const SafetySchema = z.object({
  rightsConfirmed: z.literal(true, { errorMap: () => ({ message: "You must confirm rights" }) }),
  policyConfirmed: z.literal(true, { errorMap: () => ({ message: "You must accept the policy" }) }),
  ageGuidance: z.enum(["everyone", "teen", "mature"]),
})

// Helpers for uniqueness checks (inject at runtime)
export function buildExistingTitleSet(): Set<string> {
  const set = new Set<string>()
  DEMO.forEach(g => set.add(g.title.trim().toLowerCase()))
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("myGames")
      if (raw) {
        const arr = JSON.parse(raw) as any[]
        for (const g of Array.isArray(arr) ? arr : []) {
          const t = (g?.title ?? "").toString().trim().toLowerCase()
          if (t) set.add(t)
        }
      }
    } catch {}
  }
  return set
}

export function buildExistingSlugSet(): Set<string> {
  const set = new Set<string>()
  DEMO.forEach(g => set.add(slugify(g.title)))
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("myGames")
      if (raw) {
        const arr = JSON.parse(raw) as any[]
        for (const g of Array.isArray(arr) ? arr : []) {
          const s = (g?.slug ?? slugify(g?.title ?? "")).toString().trim().toLowerCase()
          if (s) set.add(s)
        }
      }
    } catch {}
  }
  return set
}
