"use client"
import * as React from "react"
import WizardShell from "./_components/WizardShell"
import StepBasics from "./_components/StepBasics"
import StepMedia from "./_components/StepMedia"
import { useCreateDraft } from "@/lib/useCreateDraft"
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema, CommunitySchema, SafetySchema } from "@/lib/create-schema"
import StepGameplay from "./_components/StepGameplay"
import StepBuild from "./_components/StepBuild"
import StepCommunity from "./_components/StepCommunity"
import StepSafety from "./_components/StepSafety"
import StepReview from "./_components/StepReview"
import { useRouter } from "next/navigation"

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
            const slug = (draft as any).slug as string | undefined
            if (slug && slug.length > 0) router.push(`/game/${slug}`)
          }}
          onSaveDraft={() => {/* autosave is already active */}}
        />
      )}
    </WizardShell>
  )
}
