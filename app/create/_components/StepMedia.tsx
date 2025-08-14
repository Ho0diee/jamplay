"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ImageCropper from "./ImageCropper"
import { MediaSchema } from "@/lib/create-schema"
import { isYouTubeUrl } from "@/lib/youtube"

export type Draft = {
  cover?: string | null
  thumb?: string | null
  gallery?: string[]
  trailerUrl?: string | null
}

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

  const [coverFile, setCoverFile] = React.useState<File | null>(null)
  const [thumbFile, setThumbFile] = React.useState<File | null>(null)

  return (
    <div className="space-y-6">
      {errors && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Please fix the highlighted errors.
        </div>
      )}

      <Card>
        <CardTitle>Cover image</CardTitle>
        <CardDescription>Crop to 1280×720 for best results.</CardDescription>
        <div className="mt-4 space-y-3">
          <Input type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoverFile(e.target.files?.[0] ?? null)} />
          {coverFile && (
            <ImageCropper file={coverFile} preset={{ width: 1280, height: 720 }} onChange={(d) => onChange({ cover: d })} />
          )}
          {value.cover && !coverFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.cover} alt="Cover preview" className="h-40 w-full rounded object-cover" />
          )}
          {fieldError("cover") && <p className="text-xs text-red-600">{fieldError("cover")}</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Square thumbnail</CardTitle>
        <CardDescription>Crop to 512×512.</CardDescription>
        <div className="mt-4 space-y-3">
          <Input type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThumbFile(e.target.files?.[0] ?? null)} />
          {thumbFile && (
            <ImageCropper file={thumbFile} preset={{ width: 512, height: 512 }} onChange={(d) => onChange({ thumb: d })} />
          )}
          {value.thumb && !thumbFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.thumb} alt="Thumb preview" className="h-24 w-24 rounded object-cover" />
          )}
          {fieldError("thumb") && <p className="text-xs text-red-600">{fieldError("thumb")}</p>}
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
        <CardDescription>YouTube links only.</CardDescription>
        <div className="mt-3">
          <Input
            value={value.trailerUrl ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ trailerUrl: e.target.value })}
            placeholder="https://youtube.com/... or https://youtu.be/..."
          />
          {!!(value.trailerUrl) && !isYouTubeUrl(value.trailerUrl) && (
            <p className="text-xs text-red-600">Enter a valid YouTube URL</p>
          )}
        </div>
      </Card>
    </div>
  )
}
