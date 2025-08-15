import { z, type RefinementCtx } from "zod"
import { slugify, validateSlugFormat } from "@/lib/slug"
import { isYouTubeUrl } from "@/lib/youtube"
import { games as DEMO } from "@/lib/demo-data"

export const visibilityEnum = z.enum(["draft", "unlisted", "public"]) 

const BasicsCore = z.object({
  title: z.string().trim().min(4, "Min 4 characters").max(80, "Max 80 characters"),
  // tagline removed; tags removed
  category: z.string().min(1, "Category is required"),
  description: z
    .string()
    .trim()
    .min(30, "Min 30 characters")
    .refine((s: string) => isOneSentenceMaxWords(s, 20), { message: "One sentence, max 20 words" }),
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
  playUrl: z.string().optional(),
  templateId: z.string().optional(),
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

// Legacy compatibility: simple Gameplay schema used by unit tests
export const GameplaySchema = z.object({
  description: z.string().min(30),
  sessionLength: z.string().refine((v: string) => parseSessionLength(v) !== null, {
    message: "Use minutes (1–300) or m-n range",
  }),
})

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
export const BuildSchema = z
  .object({
    launchType: z.enum(["external", "embedded_template", "api_endpoint"]),
    // Current fields
    playUrl: z
      .string()
      .url("Enter a valid URL")
      .refine((u: string) => u.startsWith("https://"), "Use a valid https URL")
      .optional(),
    templateId: z
      .string()
      .regex(/^TMP-[A-Z0-9]{5,10}$/, "Template ID format TMP-XXXXX")
      .optional(),
    // Back-compat for older tests and forms
    playUrlOrTemplateId: z.string().optional(),
    version: z.string().regex(/^\d+$/, "Version must be an integer").transform((s: string) => s || "1"),
    changelog: z.string().max(200).optional(),
    instructions: z.string().trim().optional(),
    sessionLength: z
      .string()
      .optional()
      .transform((v: string | undefined, ctx: RefinementCtx) => {
        const raw = (v ?? "").trim()
        if (!raw) return undefined
        if (/^\d+$/.test(raw)) {
          const m = parseInt(raw, 10)
          if (m >= 1 && m <= 300) return { type: "single" as const, minutes: m }
        } else {
          const m = raw.match(/^(\d+)-(\d+)$/)
          if (m) {
            const min = parseInt(m[1], 10)
            const max = parseInt(m[2], 10)
            if (min >= 1 && max <= 300 && min < max) return { type: "range" as const, min, max }
          }
        }
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use minutes (1–300) or m-n range", path: ["sessionLength"] })
        return z.NEVER
      }),
  })
  .superRefine((v: any, ctx: RefinementCtx) => {
    const urlCandidate: string | undefined = v.playUrl ?? v.playUrlOrTemplateId
    const tmplCandidate: string | undefined = v.templateId ?? v.playUrlOrTemplateId
    if (v.launchType === "external") {
      if (!urlCandidate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: [v.playUrl ? "playUrl" : "playUrlOrTemplateId"] })
      } else {
        try {
          const parsed = new URL(urlCandidate)
          if (parsed.protocol !== "https:") throw new Error("not https")
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid https URL", path: [v.playUrl ? "playUrl" : "playUrlOrTemplateId"] })
        }
      }
    }
    if (v.launchType === "embedded_template") {
      const re = /^TMP-[A-Z0-9]{5,10}$/
      if (!tmplCandidate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: [v.templateId ? "templateId" : "playUrlOrTemplateId"] })
      } else if (!re.test(tmplCandidate)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Template ID format TMP-XXXXX", path: [v.templateId ? "templateId" : "playUrlOrTemplateId"] })
      }
    }
  })

// Strict version for UI (instructions + sessionLength required)
export const BuildSchemaStrict = BuildSchema.superRefine((v: any, ctx: RefinementCtx) => {
  if (!v.instructions || (typeof v.instructions === "string" && !v.instructions.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Instructions are required", path: ["instructions"] })
  }
  if (!v.sessionLength) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Session length is required", path: ["sessionLength"] })
  }
})

// Community removed

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
