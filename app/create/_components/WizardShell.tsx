"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"

const steps: { key: string; label: string; enabled: boolean }[] = [
  { key: "basics", label: "Basics", enabled: true },
  { key: "media", label: "Media", enabled: true },
  { key: "gameplay", label: "Gameplay", enabled: true },
  { key: "build", label: "Build", enabled: true },
  { key: "community", label: "Community", enabled: true },
  { key: "safety", label: "Safety", enabled: true },
  { key: "review", label: "Review", enabled: true },
]

export default function WizardShell({
  step,
  setStep,
  canContinue,
  onTryContinue,
  onReset,
  children,
}: {
  step: number
  setStep: (n: number) => void
  canContinue: boolean
  onTryContinue?: () => void
  onReset?: () => void
  children: React.ReactNode
}) {
  const goto = (idx: number) => {
    // If trying to advance forward, require current step to be valid
    if (idx > step && !canContinue) return
    if (steps[idx]?.enabled) setStep(idx)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28">
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b bg-white/70 px-4 py-3 backdrop-blur">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {steps.map((s, i) => {
            const active = i === step
            return (
              <button
                key={s.key}
                onClick={() => goto(i)}
                disabled={!s.enabled}
                className={
                  "rounded-md px-3 py-1.5 text-sm " +
                  (active
                    ? "bg-black text-white"
                    : s.enabled
                    ? "border border-neutral-300 hover:bg-neutral-50"
                    : "border border-neutral-200 text-neutral-400 cursor-not-allowed")
                }
              >
                <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700">{i + 1}</span>
                {s.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-6">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <div className="text-xs text-neutral-500">Changes are saved locally.</div>
          <div className="flex items-center gap-2">
            {onReset ? (
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              size="md"
              disabled={!canContinue}
              onClick={() => {
                onTryContinue?.()
                if (canContinue) setStep(Math.min(6, step + 1))
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
