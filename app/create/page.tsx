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
import { useRouter, useSearchParams } from "next/navigation"
import ProfilePanel from "./ProfilePanel"

export default function CreatePage() {
  const { draft, update, setFromObject, reset } = useCreateDraft()
  const [step, _setStep] = React.useState(0) // 0..6
  const [attempted, setAttempted] = React.useState<Set<number>>(() => new Set())
  const router = useRouter()
  const searchParams = useSearchParams()

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

  // Intercept setStep to block forward nav and mark attempted for error display
  const setStep = (target: number) => {
    const next = Math.max(0, Math.min(6, target))
    if (next > step) {
      if (!canContinue) {
        setAttempted((prev) => new Set(prev).add(step))
        return
      }
    }
    _setStep(next)
  }

  // Edit mode: /create?edit=slug
  React.useEffect(() => {
    const editSlug = searchParams.get("edit")
    if (!editSlug) return
    try {
      const raw = localStorage.getItem("myGames")
      if (!raw) return
      const arr = JSON.parse(raw) as any[]
      const item = (arr || []).find((g) => (g?.slug || "").toLowerCase() === editSlug.toLowerCase())
      if (item) {
        setFromObject({
          title: item.title,
          tagline: item.tagline,
          category: item.category,
          tags: item.tags,
          slug: item.slug,
          cover: item.cover,
          gallery: item.gallery,
          trailerUrl: item.trailer,
          // gameplay
          description: item.description,
          howToPlay: item.howToPlay,
          controls: item.controls,
          sessionLength: item.sessionLength,
          players: item.players,
          contentWarnings: item.contentWarnings,
          // build
          launchType: item.launchType,
          playUrlOrTemplateId: item.playUrlOrTemplateId,
          version: String(item.version ?? "1"),
          changelog: item.changelog,
          // community & safety retained if present
          creatorName: item.creatorName,
          links: item.links,
          supportUrl: item.supportUrl,
          rightsConfirmed: item.rightsConfirmed,
          policyConfirmed: item.policyConfirmed,
          ageGuidance: item.ageGuidance,
        } as any)
      }
    } catch {}
  }, [searchParams, setFromObject])

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
        errors={!basicsResult.success && attempted.has(0) ? basicsResult.error.flatten() : undefined}
              />
            )}
            {step === 1 && (
              <StepMedia
                value={draft}
                onChange={update}
        errors={!mediaResult.success && attempted.has(1) ? mediaResult.error.flatten() : undefined}
              />
            )}
            {step === 2 && (
              <StepGameplay
                value={draft}
                onChange={update}
        errors={!gameplayResult.success && attempted.has(2) ? gameplayResult.error.flatten() : undefined}
              />
            )}
            {step === 3 && (
              <StepBuild
                value={draft}
                onChange={update}
        errors={!buildResult.success && attempted.has(3) ? buildResult.error.flatten() : undefined}
              />
            )}
            {step === 4 && (
              <StepCommunity
                value={draft}
                onChange={update}
        errors={!communityResult.success && attempted.has(4) ? communityResult.error.flatten() : undefined}
              />
            )}
            {step === 5 && (
              <StepSafety
                value={draft}
                onChange={update}
        errors={!safetyResult.success && attempted.has(5) ? safetyResult.error.flatten() : undefined}
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
