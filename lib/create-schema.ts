import { z, type RefinementCtx } from "zod"
import { slugify, validateSlugFormat } from "@/lib/slug"
import { isYouTubeUrl } from "@/lib/youtube"
import { games as DEMO } from "@/lib/demo-data"

export const visibilityEnum = z.enum(["draft", "unlisted", "public"]) 

const BasicsCore = z.object({
  title: z.string().trim().min(4, "Min 4 characters").max(80, "Max 80 characters"),
  // tagline removed; tags removed
  category: z.string().min(1, "Category is required"),
  description: z.string().trim().refine((s: string) => isOneSentenceMaxWords(s, 20), { message: "One sentence, max 20 words" }),
  // slug is auto, readonly preview; still validate shape locally for safety
  slug: z.string().transform((s: string) => slugify(s)).superRefine((val: string, ctx: RefinementCtx) => {
    const fmt = validateSlugFormat(val)
    if (!fmt.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: fmt.error, path: ["slug"] })
    if (val.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Min 3 characters", path: ["slug"] })
  }),
  // visibility moved to Review & Publish
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

export const MediaSchema = z.object({
  cover: z.string().min(1, { message: "Cover is required" }),
  // gallery stores cropped data URLs (or blob URLs) only
  gallery: z.array(z.string()).max(5).optional(),
  trailerUrl: z
    .union([z.string(), z.literal("")])
    .optional()
    .transform((v: string | undefined): string | undefined => (v === "" ? undefined : v))
    .refine((v: string | undefined) => v === undefined || isYouTubeUrl(v), { message: "Enter a valid YouTube URL" }),
})

export const CreateDraftSchema = BasicsCore
  .merge(MediaSchema.partial())
  .merge(z.object({
  instructions: z.string().optional(),
    sessionLength: z.string().optional(),
  }))
  .merge(z.object({
    launchType: z.enum(["external", "embedded_template", "api_endpoint"]).optional(),
    playUrlOrTemplateId: z.string().optional(),
    version: z.string().optional(),
    changelog: z.string().optional(),
  }))
  .merge(z.object({
    rightsConfirmed: z.boolean().optional(),
    policyConfirmed: z.boolean().optional(),
    ageGuidance: z.enum(["everyone", "teen", "mature"]).optional(),
    visibility: visibilityEnum.optional(),
  }))
export type CreateDraft = z.infer<typeof CreateDraftSchema>

// No Gameplay step; its key fields moved as follows:
// - description validated in Basics
// - instructions and sessionLength validated in Build

export function parseSessionLength(input: string): { type: "single"; minutes: number } | { type: "range"; min: number; max: number } | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const m = parseInt(s, 10);
    if (m >= 1 && m <= 300) return { type: "single", minutes: m } as const;
    return null;
  }
  const m = s.match(/^(\d+)-(\d+)$/);
  if (m) {
    const min = parseInt(m[1], 10);
    const max = parseInt(m[2], 10);
    if (min >= 1 && max <= 300 && min < max) return { type: "range", min, max } as const;
  }
  return null;
}

// Helpers
export function isOneSentenceMaxWords(s: string, maxWords: number): boolean {
  const text = (s ?? "").trim()
  if (!text) return false
  // Must be a single sentence: allow one terminal punctuation .!? at end
  const sentenceBreaks = text.match(/[\.\!\?]/g) ?? []
  if (sentenceBreaks.length > 1) return false
  // Count words
  const words = text.split(/\s+/).filter(Boolean)
  return words.length > 0 && words.length <= Math.max(1, maxWords)
}
// Step 4: Build & Access
export const BuildSchema = z.object({
  launchType: z.enum(["external", "embedded_template", "api_endpoint"]),
  playUrlOrTemplateId: z.string().min(1, "Required").optional(),
  version: z.string().regex(/^\d+$/, "Version must be an integer").transform((s: string) => s || "1"),
  changelog: z.string().max(200).optional(),
  instructions: z.string().trim().min(1, "Instructions are required"),
  sessionLength: z.string().min(1, "Session length is required").transform((v: string, ctx: RefinementCtx) => {
    const s = (v ?? "").trim()
    if (/^\d+$/.test(s)) {
      const m = parseInt(s, 10)
      if (m >= 1 && m <= 300) return { type: "single" as const, minutes: m }
    } else {
      const m = s.match(/^(\d+)-(\d+)$/)
      if (m) {
        const min = parseInt(m[1], 10)
        const max = parseInt(m[2], 10)
        if (min >= 1 && max <= 300 && min < max) return { type: "range" as const, min, max }
      }
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use minutes (1–300) or m-n range", path: ["sessionLength"] })
    return z.NEVER
  }),
}).refine((v: { launchType?: string; playUrlOrTemplateId?: string }) => {
  // Require playUrlOrTemplateId when launchType is any of the allowed options
  if (!v.launchType) return false
  if (v.launchType === "external") return /^https?:\/\//i.test(v.playUrlOrTemplateId ?? "")
  if (v.launchType === "embedded_template") return /^TMP-[A-Z0-9]{5,10}$/.test(v.playUrlOrTemplateId ?? "")
  return !!v.playUrlOrTemplateId && v.playUrlOrTemplateId.trim().length > 0
}, { path: ["playUrlOrTemplateId"], message: "Required" })

// Step 5: Community
export const CommunitySchema = z.object({
  // creator/monetization hidden for now; allow optional links if present in UI
  links: z.object({
    site: z.string().url().optional(),
    discord: z.string().url().optional(),
    x: z.string().url().optional(),
  }).optional(),
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
