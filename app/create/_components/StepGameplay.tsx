"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectItem } from "@/components/ui/select"
import { normalizeTagSlug } from "@/lib/filters"
import type { CreateDraft } from "@/lib/create-schema"

const playerOpts = [
  { value: "solo", label: "Solo" },
  { value: "co-op", label: "Co-op" },
  { value: "multiplayer", label: "Multiplayer" },
]

export default function StepGameplay({
  value,
  onChange,
  errors,
}: {
  value: CreateDraft
  onChange: (patch: Partial<CreateDraft>) => void
  errors?: { fieldErrors?: Record<string, string[]> }
}) {
  const [cwInput, setCwInput] = React.useState("")

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
        <CardTitle>Gameplay</CardTitle>
        <CardDescription>Describe how it plays and what to expect.</CardDescription>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea
              value={value.description ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ description: e.target.value })}
              placeholder="A concise description of your game"
            />
            {fieldError("description") && <p className="mt-1 text-xs text-red-600">{fieldError("description")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">How to play (plain text list)</label>
            <Textarea
              value={value.howToPlay ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ howToPlay: e.target.value })}
              placeholder="1) ...\n2) ..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Controls</label>
            <Input
              value={value.controls ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ controls: e.target.value })}
              placeholder="e.g., WASD to move, Space to jump"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Session length</label>
              <Input
                value={value.sessionLength ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ sessionLength: e.target.value })}
                placeholder="e.g., 10–20 minutes"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Players</label>
              <Select value={value.players as string | undefined} onValueChange={(v) => onChange({ players: v as any })}>
                {playerOpts.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </Select>
              {fieldError("players") && <p className="mt-1 text-xs text-red-600">{fieldError("players")}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content warnings</label>
            <div className="flex gap-2">
              <Input
                value={cwInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCwInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cwInput.trim()) {
                    e.preventDefault()
                    const next = Array.from(new Set([...(value.contentWarnings ?? []), normalizeTagSlug(cwInput)]))
                    onChange({ contentWarnings: next })
                    setCwInput("")
                  }
                }}
                placeholder="Add a warning tag and press Enter"
              />
            </div>
            {!!(value.contentWarnings?.length) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {value.contentWarnings!.map((t) => (
                  <span key={t} className="rounded border px-2 py-0.5 text-xs">
                    {t}
                    <button
                      className="ml-1 text-neutral-500 hover:text-black"
                      onClick={() => onChange({ contentWarnings: (value.contentWarnings ?? []).filter((x) => x !== t) })}
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
