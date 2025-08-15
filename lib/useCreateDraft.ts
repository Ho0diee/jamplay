"use client"
import * as React from "react"
import { CreateDraft, CreateDraftSchema } from "@/lib/create-schema"
import { slugify } from "@/lib/slug"

const STORAGE_KEY = "createDraft"

export function useCreateDraft() {
  const [draft, setDraft] = React.useState<CreateDraft>(() => {
    if (typeof window === "undefined") return { visibility: "draft" } as CreateDraft
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { visibility: "draft" } as CreateDraft
  const parsed = JSON.parse(raw)
  // Lenient migration: ensure required keys exist and strip removed ones
  const migrated: any = { ...(parsed || {}) }
  // Remove legacy/unused fields
  delete migrated.controls
  delete migrated.community
  if (migrated.links) delete migrated.links
  // Normalize legacy sessionLength (string/range) to number or unset
  if (typeof migrated.sessionLength === "string") {
    const s = migrated.sessionLength.trim()
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10)
      const allowed = [5,10,15,20,30,45,60,90,120]
      migrated.sessionLength = allowed.includes(n) ? n : undefined
    } else {
      delete migrated.sessionLength
    }
  }
  // Ensure slug is present and coherent with title for schema validation
  if (!migrated.slug) migrated.slug = slugify(migrated.title ?? "")
  // Default sensible values
  if (!migrated.visibility) migrated.visibility = "draft"
  const res = CreateDraftSchema.safeParse(migrated)
  return (res.success ? res.data : { visibility: "draft" }) as CreateDraft
    } catch {
      return { visibility: "draft" } as CreateDraft
    }
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {}
  }, [draft])

  const update = React.useCallback((patch: Partial<CreateDraft>) => {
    setDraft((d: CreateDraft) => {
      const next = { ...d, ...patch } as any
      // keep slug aligned to title for previews
      if (typeof next.title === "string") next.slug = slugify(next.title)
      return next as CreateDraft
    })
  }, [])

  const setFromObject = React.useCallback((obj: Partial<CreateDraft>) => {
    const clean: any = { ...(obj as any) }
    delete clean.controls
    if (!clean.slug && typeof clean.title === "string") clean.slug = slugify(clean.title)
    setDraft(() => ({ ...(clean as CreateDraft) }))
  }, [])

  const reset = React.useCallback(() => {
    setDraft({ visibility: "draft" } as CreateDraft)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return { draft, update, setFromObject, reset }
}
