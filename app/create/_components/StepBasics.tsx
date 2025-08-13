"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectItem } from "@/components/ui/select"
import { normalizeTagSlug } from "@/lib/filters"
import { BasicsSchema, type CreateDraft } from "@/lib/create-schema"

type Draft = CreateDraft

const categories = [
  "Adventure",
  "RPG",
  "Puzzle",
  "Horror",
  "Sci-Fi",
  "Romance",
]

const visOptions = [
  { value: "draft", label: "Draft" },
  { value: "unlisted", label: "Unlisted" },
  { value: "public", label: "Public" },
]

export default function StepBasics({
  value,
  onChange,
  errors,
}: {
  value: Draft
  onChange: (patch: Partial<Draft>) => void
  errors?: { fieldErrors?: Record<string, string[]> }
}) {
  const [tagInput, setTagInput] = React.useState("")

  const fieldError = (name: string) => {
    // errors from zod flatten have shape { fieldErrors: { name: string[] } }
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
        <CardTitle>Basics</CardTitle>
        <CardDescription>Tell us the essentials about your game.</CardDescription>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input
              value={value.title ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange({ title: e.target.value, slug: value.slug ? value.slug : normalizeTagSlug(e.target.value) })
              }
              placeholder="e.g., Galactic Chef"
              maxLength={80}
            />
            {fieldError("title") && <p className="mt-1 text-xs text-red-600">{fieldError("title")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tagline</label>
            <Textarea
              value={value.tagline ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ tagline: e.target.value })}
              placeholder="A one-line hook for your game"
              maxLength={120}
            />
            {fieldError("tagline") && <p className="mt-1 text-xs text-red-600">{fieldError("tagline")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <Select
              value={value.category}
              onValueChange={(v) => onChange({ category: v })}
              placeholder="Select category"
            >
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </Select>
            {fieldError("category") && <p className="mt-1 text-xs text-red-600">{fieldError("category")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault()
                    const next = Array.from(new Set([...(value.tags ?? []), normalizeTagSlug(tagInput)]))
                    onChange({ tags: next })
                    setTagInput("")
                  }
                }}
                placeholder="Add a tag and press Enter"
              />
            </div>
            {!!(value.tags?.length) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {value.tags!.map((t) => (
                  <span key={t} className="rounded border px-2 py-0.5 text-xs">
                    {t}
                    <button
                      className="ml-1 text-neutral-500 hover:text-black"
                      onClick={() => onChange({ tags: (value.tags ?? []).filter((x) => x !== t) })}
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <Input
              value={value.slug ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ slug: normalizeTagSlug(e.target.value) })}
              placeholder="galactic-chef"
            />
            {fieldError("slug") && <p className="mt-1 text-xs text-red-600">{fieldError("slug")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Visibility</label>
            <Select
              value={value.visibility ?? "draft"}
              onValueChange={(v) => onChange({ visibility: v as Draft["visibility"] })}
            >
              {visOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </Card>
    </div>
  )
}
