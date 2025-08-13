"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import type { CreateDraft } from "@/lib/create-schema"

const launchTypes = [
  { value: "external", label: "External URL" },
  { value: "embedded_template", label: "Embedded Template" },
  { value: "api_endpoint", label: "API Endpoint" },
]

export default function StepBuild({
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
        <CardTitle>Build & Access</CardTitle>
        <CardDescription>How players start the game and what’s new.</CardDescription>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Launch type</label>
            <Select value={value.launchType as string | undefined} onValueChange={(v) => onChange({ launchType: v as any })}>
              {launchTypes.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Play URL or Template ID</label>
            <Input
              value={value.playUrlOrTemplateId ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ playUrlOrTemplateId: e.target.value })}
              placeholder="https://... OR template-abc123"
            />
            {fieldError("playUrlOrTemplateId") && <p className="mt-1 text-xs text-red-600">{fieldError("playUrlOrTemplateId")}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Version</label>
              <Input
                value={value.version ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ version: e.target.value })}
                placeholder="1.0.0"
              />
              {fieldError("version") && <p className="mt-1 text-xs text-red-600">{fieldError("version")}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Changelog</label>
              <Input
                value={value.changelog ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ changelog: e.target.value })}
                placeholder="Short update notes"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
