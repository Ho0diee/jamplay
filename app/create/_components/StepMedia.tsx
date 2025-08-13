"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MediaSchema } from "@/lib/create-schema"

export type Draft = {
  cover?: string | null
  gallery?: string[]
  trailerUrl?: string | null
}

const placeholders = [
  "/logo.svg",
  "https://picsum.photos/seed/cover1/800/450",
  "https://picsum.photos/seed/cover2/800/450",
  "https://picsum.photos/seed/cover3/800/450",
]

export default function StepMedia({
  value,
  onChange,
  errors,
}: {
  value: Draft
  onChange: (patch: Partial<Draft>) => void
  errors?: ReturnType<typeof MediaSchema["safeParse"]>["error"] extends infer E
    ? E extends { flatten: () => infer F }
      ? F & { fieldErrors: Record<string, string[]> }
      : any
    : any
}) {
  const fieldError = (name: string) => {
    const list = (errors?.fieldErrors as Record<string, string[] | undefined>)?.[name]
    return list && list.length ? list[0] : undefined
  }

  const handleFile = async (file: File) => {
    // No real upload; create an object URL as a stand-in
    const url = URL.createObjectURL(file)
    onChange({ cover: url })
  }

  return (
    <div className="space-y-6">
      {errors && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Please fix the highlighted errors.
        </div>
      )}
      <Card>
        <CardTitle>Cover image</CardTitle>
        <CardDescription>Upload an image or pick a placeholder so you can keep going.</CardDescription>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Input type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }} />
            <Button type="button" variant="outline" onClick={() => onChange({ cover: placeholders[0] })}>Use placeholder</Button>
          </div>
          {value.cover && (
            <img src={value.cover} alt="Cover preview" className="h-40 w-full rounded object-cover" />
          )}
          {fieldError("cover") && <p className="text-xs text-red-600">{fieldError("cover")}</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Gallery (optional)</CardTitle>
        <CardDescription>Up to 5 image URLs.</CardDescription>
        <div className="mt-3 space-y-2">
          {(value.gallery ?? []).map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...(value.gallery ?? [])]
                  next[idx] = e.target.value
                  onChange({ gallery: next })
                }}
                placeholder="https://..."
              />
              <Button variant="ghost" onClick={() => onChange({ gallery: (value.gallery ?? []).filter((_, i) => i !== idx) })}>Remove</Button>
            </div>
          ))}
          {(value.gallery?.length ?? 0) < 5 && (
            <Button variant="outline" onClick={() => onChange({ gallery: [...(value.gallery ?? []), ""] })}>Add URL</Button>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Trailer URL (optional)</CardTitle>
        <CardDescription>YouTube or other video link.</CardDescription>
        <div className="mt-3">
          <Input
            value={value.trailerUrl ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ trailerUrl: e.target.value })}
            placeholder="https://youtube.com/..."
          />
        </div>
      </Card>
    </div>
  )
}
