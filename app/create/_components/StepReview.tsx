"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { CreateDraft } from "@/lib/create-schema"

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="text-neutral-500">{label}</div>
      <div className="max-w-[70%] text-right">{value}</div>
    </div>
  )
}

export default function StepReview({
  value,
  onPublish,
  onSaveDraft,
  onEditStep,
}: {
  value: CreateDraft
  onPublish: () => void
  onSaveDraft: () => void
  onEditStep: (stepIndex: number) => void
}) {
  const title = (value as any).title as string | undefined

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Review & Publish</CardTitle>
        <CardDescription>Double-check details, then publish.</CardDescription>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <Row label="Title" value={(value as any).title} />
            <Row label="Category" value={(value as any).category} />
            <Row label="Tags" value={(value as any).tags?.join(", ")} />
            <Row label="Visibility" value={(value as any).visibility} />
            <hr className="my-2" />
            <Row label="Description" value={(value as any).description} />
            <Row label="How to play" value={(value as any).howToPlay} />
            <Row label="Controls" value={(value as any).controls} />
            <Row label="Session length" value={(value as any).sessionLength} />
            <Row label="Players" value={(value as any).players} />
            <Row label="Content warnings" value={(value as any).contentWarnings?.join(", ")} />
            <hr className="my-2" />
            <Row label="Launch type" value={(value as any).launchType} />
            <Row label="Play URL / Template ID" value={(value as any).playUrlOrTemplateId} />
            <Row label="Version" value={(value as any).version} />
            <Row label="Changelog" value={(value as any).changelog} />
            <hr className="my-2" />
            <Row label="Creator" value={(value as any).creatorName} />
            <Row label="Links" value={
              [(value as any).links?.site, (value as any).links?.discord, (value as any).links?.x]
                .filter(Boolean)
                .join(" • ")
            } />
            <Row label="Support" value={(value as any).supportUrl} />
            <hr className="my-2" />
            <Row label="Age guidance" value={(value as any).ageGuidance} />
            <Row label="Rights confirmed" value={(value as any).rightsConfirmed ? "Yes" : undefined} />
            <Row label="Policy confirmed" value={(value as any).policyConfirmed ? "Yes" : undefined} />
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="aspect-video w-full overflow-hidden rounded bg-neutral-50">
                {(value as any).cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(value as any).cover} alt="cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-500">No cover</div>
                )}
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{(value as any).title ?? "Untitled"}</div>
                <div className="text-neutral-600">{(value as any).category ?? "No category"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="md" onClick={onPublish} disabled={!title}>Publish</Button>
              <Button variant="outline" onClick={onSaveDraft}>Save Draft</Button>
            </div>

            <div className="text-sm text-neutral-600">
              Edit: {Array.from({ length: 6 }).map((_, i) => (
                <button key={i} className="text-black underline underline-offset-2" onClick={() => onEditStep(i)}>
                  Step {i + 1}
                </button>
              )).reduce((acc: React.ReactNode[], el, i) => (i ? [...acc, <span key={`sep-${i}`}> • </span>, el] : [el]), [] as React.ReactNode[])}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
