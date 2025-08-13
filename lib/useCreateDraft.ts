"use client"
import * as React from "react"
import { CreateDraft, CreateDraftSchema } from "@/lib/create-schema"

const STORAGE_KEY = "createDraft"

export function useCreateDraft() {
  const [draft, setDraft] = React.useState<CreateDraft>(() => {
    if (typeof window === "undefined") return { visibility: "draft" } as CreateDraft
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { visibility: "draft" } as CreateDraft
      const parsed = JSON.parse(raw)
      const res = CreateDraftSchema.safeParse(parsed)
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
    setDraft((d: CreateDraft) => ({ ...d, ...patch }))
  }, [])

  const setFromObject = React.useCallback((obj: Partial<CreateDraft>) => {
    setDraft(() => ({ ...(obj as CreateDraft) }))
  }, [])

  const reset = React.useCallback(() => {
    setDraft({ visibility: "draft" } as CreateDraft)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return { draft, update, setFromObject, reset }
}
