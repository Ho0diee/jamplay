"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { CreateDraft } from "@/lib/create-schema"

export default function StepCommunity({
  value,
  onChange,
  errors,
}: {
  value: CreateDraft
  onChange: (patch: Partial<CreateDraft>) => void
  errors?: { fieldErrors?: Record<string, string[]> }
}) {
  const fieldError = (name: string) => {
    const list = errors?.fieldErrors?.[name]
    return list && list.length ? list[0] : undefined
  }

  return (
    <div className="space-y-6">
      {errors && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Please fix the highlighted errors.
        </div>
      )}
      <Card>
        <CardTitle>Community</CardTitle>
        <CardDescription>Who made this and where to follow along.</CardDescription>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Creator name</label>
            <Input
              value={value.creatorName ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ creatorName: e.target.value })}
              placeholder="Studio or person"
            />
            {fieldError("creatorName") && <p className="mt-1 text-xs text-red-600">{fieldError("creatorName")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Website</label>
              <Input
                value={value.links?.site ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ links: { ...(value.links ?? {}), site: e.target.value } })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Discord</label>
              <Input
                value={value.links?.discord ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ links: { ...(value.links ?? {}), discord: e.target.value } })}
                placeholder="https://discord.gg/..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">X (Twitter)</label>
              <Input
                value={value.links?.x ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ links: { ...(value.links ?? {}), x: e.target.value } })}
                placeholder="https://x.com/..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Support URL (optional)</label>
              <Input
                value={value.supportUrl ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ supportUrl: e.target.value })}
                placeholder="https://patreon.com/..."
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
