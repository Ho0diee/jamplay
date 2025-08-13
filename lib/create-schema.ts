import { z } from "zod"

export const visibilityEnum = z.enum(["draft", "unlisted", "public"]) 

export const BasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(80, "Max 80 characters"),
  tagline: z
    .union([z.string().max(120, "Max 120 characters"), z.literal("")])
    .optional()
  .transform((v: string | undefined): string | undefined => (v === "" ? undefined : v)),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(10).optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  visibility: visibilityEnum.default("draft"),
})

export const MediaSchema = z.object({
  cover: z.string().min(1, { message: "Cover is required" }),
  gallery: z.array(z.string().url()).max(5).optional(),
  trailerUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
  .transform((v: string | undefined): string | undefined => (v === "" ? undefined : v)),
})

export const CreateDraftSchema = BasicsSchema.merge(MediaSchema.partial())
export type CreateDraft = z.infer<typeof CreateDraftSchema>

// Step 3: Gameplay
export const GameplaySchema = z.object({
  description: z.string().min(1, "Description is required"),
  howToPlay: z.string().optional(),
  controls: z.string().optional(),
  sessionLength: z.string().optional(),
  players: z.enum(["solo", "co-op", "multiplayer"]),
  contentWarnings: z.array(z.string()).max(20).optional(),
})

// Step 4: Build & Access
export const BuildSchema = z.object({
  launchType: z.enum(["external", "embedded_template", "api_endpoint"]),
  playUrlOrTemplateId: z.string().min(1, "Required").optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Use semver, e.g., 1.0.0"),
  changelog: z.string().max(200).optional(),
}).refine((v: { launchType?: string; playUrlOrTemplateId?: string }) => {
  // Require playUrlOrTemplateId when launchType is any of the allowed options
  if (!v.launchType) return false
  return !!v.playUrlOrTemplateId && v.playUrlOrTemplateId.trim().length > 0
}, { path: ["playUrlOrTemplateId"], message: "Required" })

// Step 5: Community
export const CommunitySchema = z.object({
  creatorName: z.string().min(1, "Creator name is required"),
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
