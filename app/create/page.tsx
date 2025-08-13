"use client"
import * as React from "react"
import WizardShell from "./_components/WizardShell"
import StepBasics from "./_components/StepBasics"
import StepMedia from "./_components/StepMedia"
import StepGameplay from "./_components/StepGameplay"
import StepBuild from "./_components/StepBuild"
import StepCommunity from "./_components/StepCommunity"
import StepSafety from "./_components/StepSafety"
import StepReview from "./_components/StepReview"
import { useCreateDraft } from "@/lib/useCreateDraft"
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema, CommunitySchema, SafetySchema } from "@/lib/create-schema"
import { useRouter } from "next/navigation"
import ProfilePanel from "./ProfilePanel"

export default function CreatePage() {
  const { draft, update, reset } = useCreateDraft()
  const [step, setStep] = React.useState(0) // 0..6
  const router = useRouter()

  const basicsResult = React.useMemo(() => BasicsSchema.safeParse(draft), [draft])
  const mediaResult = React.useMemo(() => MediaSchema.safeParse(draft), [draft])
  const gameplayResult = React.useMemo(() => GameplaySchema.safeParse(draft), [draft])
  const buildResult = React.useMemo(() => BuildSchema.safeParse(draft), [draft])
  const communityResult = React.useMemo(() => CommunitySchema.safeParse(draft), [draft])
  const safetyResult = React.useMemo(() => SafetySchema.safeParse(draft), [draft])

  const canContinue = (
    step === 0 ? basicsResult.success
    : step === 1 ? mediaResult.success
    : step === 2 ? gameplayResult.success
    : step === 3 ? buildResult.success
    : step === 4 ? communityResult.success
    : step === 5 ? safetyResult.success
    : true
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WizardShell
            step={step}
            setStep={(s: number)=> setStep(Math.max(0, Math.min(6, s)))}
            canContinue={canContinue}
            onReset={reset}
          >
            {step === 0 && (
              <StepBasics
                value={draft}
                onChange={update}
                errors={!basicsResult.success ? basicsResult.error.flatten() : undefined}
              />
            )}
            {step === 1 && (
              <StepMedia
                value={draft}
                onChange={update}
                errors={!mediaResult.success ? mediaResult.error.flatten() : undefined}
              />
            )}
            {step === 2 && (
              <StepGameplay
                value={draft}
                onChange={update}
                errors={!gameplayResult.success ? gameplayResult.error.flatten() : undefined}
              />
            )}
            {step === 3 && (
              <StepBuild
                value={draft}
                onChange={update}
                errors={!buildResult.success ? buildResult.error.flatten() : undefined}
              />
            )}
            {step === 4 && (
              <StepCommunity
                value={draft}
                onChange={update}
                errors={!communityResult.success ? communityResult.error.flatten() : undefined}
              />
            )}
            {step === 5 && (
              <StepSafety
                value={draft}
                onChange={update}
                errors={!safetyResult.success ? safetyResult.error.flatten() : undefined}
              />
            )}
            {step === 6 && (
              <StepReview
                value={draft}
                onEditStep={(idx: number) => setStep(Math.max(0, Math.min(6, idx)))}
                onPublish={() => {
                  const d: any = draft as any
                  const slug = (d?.slug as string | undefined)?.trim()
                  const title = (d?.title as string | undefined)?.trim()
                  if (!slug || !title) return
                  const nowIso = new Date().toISOString()
                  const description = (d?.description as string | undefined)?.trim() || (d?.tagline as string | undefined)?.trim() || title
                  const tags = Array.isArray(d?.tags) ? d.tags as string[] : []
                  const category = (d?.category as string | undefined)
                  const cover = (d?.cover as string | undefined) || "/logo.svg"
                  const game = {
                    slug,
                    title,
                    description,
                    tags,
                    category,
                    cover,
                    publishedAt: nowIso,
                    updatedAt: nowIso,
                    plays48h: 0,
                    likes7d: { up: 0, total: 0 },
                    likesAll: { up: 0, total: 0 },
                    editorsPick: false,
                    origin: "local" as const,
                  }
                  try {
                    if (typeof window !== "undefined") {
                      const raw = localStorage.getItem("myGames")
                      const arr = raw ? (JSON.parse(raw) as any[]) : []
                      const bySlug = new Map<string, any>()
                      for (const g of Array.isArray(arr) ? arr : []) {
                        const gs = (g?.slug || "").toString().toLowerCase()
                        if (gs) bySlug.set(gs, g)
                      }
                      bySlug.set(slug.toLowerCase(), game)
                      localStorage.setItem("myGames", JSON.stringify(Array.from(bySlug.values())))
                    }
                  } catch {}
                  router.push(`/game/${slug}`)
                }}
                onSaveDraft={() => { /* autosave already active */ }}
              />
            )}
          </WizardShell>
        </div>
        <div className="lg:col-span-1">
          <ProfilePanel />
        </div>
      </div>
    </div>
  )
}
